'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home as HomeIcon,
    Sun,
    Building2,
    Construction,
    Radio,
    Fan as FanIcon,
    Droplets,
    Camera,
    Map as MapIcon,
    Shield,
    Sparkles,
    Target,
    Zap,
    ChevronRight,
    ChevronLeft,
    Loader2,
    ArrowRight,
    Ruler,
    MoveHorizontal,
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Info,
    MapPin,
    Calendar,
    Activity,
    Maximize2,
    LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { cn, calculatePriorityScore } from '@/lib/utils';
import { FileUploader } from '@/components/FileUploader';
import { JobContextForm, JobData } from '@/components/JobContextForm';
import { ImageOverlay, Annotation } from '@/components/ImageOverlay';
import { MeasurementOverlay } from '@/components/MeasurementOverlay';
import { storage, Damage, SurveyRecord, trainingStorage } from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    History as HistoryIcon,
    Link as LinkIcon,
    Unlink
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import exifr from 'exifr';
import { SiteMapView } from '@/components/SiteMapView';

export interface DroneMetadata {
    lat: number;
    lng: number;
    altitude: number | null;
    pitch: number | null;
    heading: number | null;
    timestamp: string | null;
    model: string | null;
}



type Step = 'upload' | 'context' | 'analyzing' | 'review';

export default function SurveyPage() {
    const { user } = useAuth();
    const findingRefs = useRef<any[]>([]);
    const [step, setStep] = useState<Step>('upload');
    const [images, setImages] = useState<File[]>([]);
    const [overviewImageIndex, setOverviewImageIndex] = useState<number>(0);
    const [jobData, setJobData] = useState<JobData>({
        id: `survey-${Date.now()}`,
        assetId: `asset-${Date.now()}`,
        title: '',
        clientName: '',
        location: '',
        description: '',
        type: 'roof',
    });
    const [imageDates, setImageDates] = useState<string[]>([]);
    const [imageCoords, setImageCoords] = useState<{ lat: number, lng: number }[]>([]);
    const [imageMetadata, setImageMetadata] = useState<DroneMetadata[]>([]);

    const handleImagesSelected = async (newImages: File[]) => {
        setImages((prev) => [...prev, ...newImages]);
        const newDates = newImages.map(f => new Date(f.lastModified).toLocaleString());
        setImageDates(prev => [...prev, ...newDates]);

        // Extract rich DJI metadata using exifr
        const newMetaData = await Promise.all(newImages.map(extractDroneMetadata));
        setImageMetadata(prev => [...prev, ...newMetaData]);

        // Keep coords for backwards compatibility in other components
        setImageCoords(prev => [...prev, ...newMetaData.map(m => ({ lat: m.lat, lng: m.lng }))]);
    };

    const extractDroneMetadata = async (file: File): Promise<DroneMetadata> => {
        try {
            // exifr automatically handles parsing EXIF, TIFF (camera model), and XMP (DJI custom tags)
            const meta = await exifr.parse(file, { xmp: true, tiff: true, gps: true, exif: true });

            if (!meta) return { lat: 0, lng: 0, altitude: null, pitch: null, heading: null, timestamp: null, model: null };

            return {
                lat: meta.latitude || 0,
                lng: meta.longitude || 0,
                altitude: meta.RelativeAltitude || null,
                pitch: meta.GimbalPitchDegree || meta.FlightPitchDegree || null,
                heading: meta.GimbalYawDegree || meta.FlightYawDegree || null,
                timestamp: meta.DateTimeOriginal ? new Date(meta.DateTimeOriginal).toISOString() : null,
                model: meta.Model || null
            };
        } catch (err) {
            console.error('Failed to parse EXIF/XMP for file', file.name, err);
            return { lat: 0, lng: 0, altitude: null, pitch: null, heading: null, timestamp: null, model: null };
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImageDates(prev => prev.filter((_, i) => i !== index));
        setImageCoords(prev => prev.filter((_, i) => i !== index));
        setImageMetadata(prev => prev.filter((_, i) => i !== index));
    };

    const handleJobDataChange = (field: keyof JobData, value: string) => {
        setJobData((prev) => ({ ...prev, [field]: value }));
    };

    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [analyzedImages, setAnalyzedImages] = useState<string[]>([]);
    const [reportImages, setReportImages] = useState<string[]>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [precisionMode, setPrecisionMode] = useState(false);
    const [reviewMode, setReviewMode] = useState<'inspect' | 'detail' | 'measure' | 'markup'>('inspect');
    const [linkingFindingIndex, setLinkingFindingIndex] = useState<number | null>(null);
    const [assetHistory, setAssetHistory] = useState<SurveyRecord[]>([]);
    const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
    const [imageScales, setImageScales] = useState<Record<number, number>>({});
    const [isCalibrating, setIsCalibrating] = useState<number | null>(null);
    const [visionMode, setVisionMode] = useState<'visual' | 'thermal'>('visual');
    const [analysisLog, setAnalysisLog] = useState<string[]>([]);

    useEffect(() => {
        const loadSavedSurvey = async () => {
            const id = new URLSearchParams(window.location.search).get('id');
            if (id) {
                const saved = await storage.getSurvey(id);
                if (saved) {
                    setJobData(saved.jobData);
                    setAnalysisResult(saved.analysisResult);
                    setAnalyzedImages([saved.thumbnail]);
                    setStep('review');
                }
            }
        };
        loadSavedSurvey();
    }, []);

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { ReportDocument } = await import('@/components/ReportDocument');
            // Use high-res report images for the PDF, falling back to AI images
            const pdfImages = reportImages.length > 0 ? reportImages : analyzedImages;
            // @ts-ignore
            const blob = await pdf(
                <ReportDocument
                    jobData={jobData}
                    analysisResult={analysisResult}
                    images={pdfImages}
                    imageDates={imageDates}
                    imageCoords={imageCoords}
                    imageScales={images.map((_: any, i: number) => imageScales[i] ?? null)}
                    overviewImageIndex={overviewImageIndex}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Survey_Report_${jobData.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleSaveToDashboard = async () => {
        if (!analysisResult || !user) return;

        const id = new URLSearchParams(window.location.search).get('id') || `survey-${Date.now()}`;

        try {
            await storage.saveSurvey({
                id,
                date: new Date().toISOString(),
                jobData,
                analysisResult,
                thumbnail: analyzedImages[0] || '',
                findingCount: analysisResult.damages.length,
                healthScore: analysisResult.assetHealthScore,
                status: 'Finalized'
            }, user.id);

            setAnalysisLog(prev => [...prev, "✓ Inspection saved to Dashboard successfully."]);
        } catch (error) {
            console.error('Failed to save survey:', error);
            setAnalysisLog(prev => [...prev, "✗ Failed to save inspection. Please try again."]);
        }
    };

    const resizeImage = (file: File, index: number, maxDim: number, quality: number, label: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUri = canvas.toDataURL('image/jpeg', quality);
                    console.log(`[${label}] Image ${index + 1}: ${file.name} → ${width}x${height}, ${(dataUri.length / 1024).toFixed(0)}KB`);
                    resolve(dataUri);
                };
                img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            };
            reader.onerror = error => reject(error);
        });
    };

    // Aggressively compressed for AI analysis — small payload, allows 50+ photos
    const optimizeForAI = (file: File, index: number) => resizeImage(file, index, 768, 0.7, 'AI');

    // Moderately compressed for report/UI — sharp enough for professional A4 PDF
    const optimizeForReport = (file: File, index: number) => resizeImage(file, index, 2400, 0.85, 'Report');

    const handleStartAnalysis = async () => {
        setStep('analyzing');
        setAnalysisLog([`Optimizing ${images.length} image(s) (dual-resolution)...`, 'Connecting to SEQ Vision engine...']);

        try {
            // Generate both image sets in parallel:
            // - AI images: 768px, aggressive compression for fast API calls
            // - Report images: 2400px, high quality for sharp PDFs
            const [aiImages, highResImages] = await Promise.all([
                Promise.all(images.map((file, index) => optimizeForAI(file, index))),
                Promise.all(images.map((file, index) => optimizeForReport(file, index))),
            ]);

            // Verify all images are unique
            const uniqueSet = new Set(aiImages.map(img => img.length));
            console.log(`[Analysis] ${aiImages.length} AI images optimized, ${uniqueSet.size} unique by size`);
            console.log(`[Analysis] ${highResImages.length} report images generated`);
            if (uniqueSet.size < aiImages.length) {
                console.warn('[Analysis] ⚠ Some images may be identical! Check uploads.');
            }

            // Store high-res for report/UI display, low-res for AI & review reference
            setReportImages(highResImages);
            setAnalyzedImages(highResImages);

            setAnalysisLog(prev => [...prev, `Sending ${aiImages.length} assets to AI for review...`, 'Tracing defect boundaries...']);

            const controller = new AbortController();
            // Give more time for multiple images: 55s base + 30s per additional image
            const timeoutMs = 55000 + ((images.length - 1) * 30000);
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            // Gather active training rules
            const activeRulesData = user ? await trainingStorage.getActiveRules(user.id) : [];
            const activeRules = activeRulesData.map(r => r.rule);
            if (activeRules.length > 0) {
                setAnalysisLog(prev => [...prev, `Applying ${activeRules.length} training rules...`]);
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: aiImages, // Send small AI-optimized images, not full-res
                    jobData,
                    trainingRules: activeRules,
                    imageMetadata, // Pass DJI metadata context to the AI
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Analysis timed out or failed on server.');
            }

            setAnalysisLog(prev => [...prev, 'Finalized report data. Building editor...']);
            const data = await response.json();

            // Log image index mapping
            console.log(`[Analysis] Received ${data.damages?.length || 0} findings:`);
            data.damages?.forEach((d: any, i: number) => {
                console.log(`  Finding ${i + 1}: "${d.title}" → imageIndex=${d.imageIndex}`);
            });

            // Verify all imageIndex values are within bounds
            const damagesWithIds = data.damages.map((d: any) => {
                const safeImageIndex = (d.imageIndex >= 0 && d.imageIndex < aiImages.length)
                    ? d.imageIndex
                    : 0;
                if (safeImageIndex !== d.imageIndex) {
                    console.warn(`[Analysis] Fixed out-of-range imageIndex: ${d.imageIndex} → ${safeImageIndex}`);
                }
                return {
                    ...d,
                    imageIndex: safeImageIndex,
                    id: `finding-${Math.random().toString(36).substr(2, 9)}`
                };
            });

            setAnalysisResult({ ...data, damages: damagesWithIds });
            setStep('review');
        } catch (error: any) {
            console.error('Analysis Error:', error);
            alert(`Analysis failed: ${error.message || 'Please check your connection and try again.'}`);
            setStep('context');
        }
    };

    const handleLinkFinding = (currentIdx: number, previousSurveyId: string, previousFindingId: string) => {
        const prevSurvey = assetHistory.find(s => s.id === previousSurveyId);
        const prevFinding = prevSurvey?.analysisResult.damages.find(d => d.id === previousFindingId);

        if (!prevFinding) return;

        const currentFinding = analysisResult.damages[currentIdx];

        const newDamages = [...analysisResult.damages];
        newDamages[currentIdx] = {
            ...newDamages[currentIdx],
            parentFindingId: previousFindingId,
            comparisonData: {
                status: 'Linked',
                percentChange: 0
            }
        };

        setAnalysisResult({ ...analysisResult, damages: newDamages });
        setIsLinkingModalOpen(false);
        setLinkingFindingIndex(null);
    };

    useEffect(() => {
        const loadAssetHistory = async () => {
            if (jobData.assetId && user) {
                const history = await storage.getHistory(user.id);
                setAssetHistory(history.filter(s => s.jobData.assetId === jobData.assetId && s.id !== jobData.id));
            }
        };
        loadAssetHistory();
    }, [jobData.assetId, jobData.id, user]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Simple Header */}
            <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/images/logo.png"
                            alt="SEQ Drone Inspections"
                            width={200}
                            height={50}
                            className="h-12 w-auto brightness-0 invert"
                            priority
                        />
                        <span className="text-muted-foreground font-normal mx-2">/</span>
                        <span className="text-sm font-medium bg-white/5 py-1 px-3 rounded-full">New Survey</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Step {step === 'upload' ? 1 : step === 'context' ? 2 : 3} of 3</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold">Upload Survey Images</h1>
                                <p className="text-muted-foreground">Select the high-resolution drone photos you want to analyze.</p>
                            </div>

                            <FileUploader
                                onImagesSelected={handleImagesSelected}
                                selectedImages={images}
                                onRemoveImage={handleRemoveImage}
                                overviewImageIndex={overviewImageIndex}
                                onSetOverview={setOverviewImageIndex}
                            />

                            <div className="flex justify-end pt-8">
                                <button
                                    onClick={() => setStep('context')}
                                    disabled={images.length === 0}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next Details
                                    <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'context' && (
                        <motion.div
                            key="context"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold">Job Details</h1>
                                <p className="text-muted-foreground">Tell the AI what to look for in these {images.length} images.</p>
                            </div>

                            <JobContextForm
                                data={jobData}
                                onChange={handleJobDataChange}
                            />

                            <div className="flex justify-between pt-8">
                                <button
                                    onClick={() => setStep('upload')}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-6 py-3 font-medium transition-colors"
                                >
                                    <ChevronLeft className="size-4" />
                                    Back
                                </button>

                                <button
                                    onClick={handleStartAnalysis}
                                    disabled={!jobData.title || !jobData.description}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    Start Analysis
                                    <Sparkles className="size-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'analyzing' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 text-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 scale-150 blur-xl animate-pulse" />
                                <div className="relative size-24">
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[spin_1.5s_linear_infinite]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="size-10 text-primary animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black tracking-tight">AI Vision Scanner Active</h2>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                    Analyzing {images.length} High-Resolution Assets for
                                    <span className="text-white font-bold ml-1">{jobData.type.toUpperCase()}</span> defects.
                                </p>
                            </div>

                            {/* Analysis Log Feedback */}
                            <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-left space-y-2">
                                {analysisLog.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-3"
                                    >
                                        <span className="text-primary opacity-50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        <span className="text-slate-300">{log}</span>
                                    </motion.div>
                                ))}
                                <div className="flex gap-3 animate-pulse">
                                    <span className="text-primary opacity-50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <span className="text-primary">Awaiting Vision API response...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'review' && analysisResult && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12 pb-20"
                        >
                            {/* Editor Header */}
                            <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/5 pb-8">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                                        Phase 3: Review & Refine
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight">Report Editor</h2>
                                    <p className="text-muted-foreground text-lg">Human-in-the-loop verification. Customize any AI finding before finalizing.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-[#0a0f1d] p-1.5 rounded-full border border-white/5 shadow-inner">
                                        <button
                                            onClick={() => setReviewMode('inspect')}
                                            className={cn(
                                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                reviewMode === 'inspect' ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Inspect
                                        </button>
                                        <button
                                            onClick={() => setReviewMode('detail')}
                                            className={cn(
                                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                reviewMode === 'detail' ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Detail View
                                        </button>
                                        <button
                                            onClick={() => setReviewMode('measure')}
                                            className={cn(
                                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                reviewMode === 'measure' ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Ruler className="size-3" />
                                            Measure
                                        </button>
                                        <button
                                            onClick={() => setReviewMode('markup')}
                                            className={cn(
                                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                reviewMode === 'markup' ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Construction className="size-3" />
                                            Markup
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-full">
                                        <button
                                            onClick={() => setVisionMode('visual')}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                visionMode === 'visual' ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                                            )}
                                        >
                                            Visual
                                        </button>
                                        <button
                                            onClick={() => setVisionMode('thermal')}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                                visionMode === 'thermal' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-muted-foreground hover:text-white"
                                            )}
                                        >
                                            <Zap className="size-3" />
                                            Thermal
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isGeneratingPdf}
                                        className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 shadow-2xl shadow-white/10 transition-all disabled:opacity-50 active:scale-95 translate-y-[-2px]"
                                    >
                                        {isGeneratingPdf ? <Loader2 className="size-4 animate-spin" /> : "Finalize & Export PDF"}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-12">
                                {/* Site Intelligence Map */}
                                <SiteMapView
                                    findings={analysisResult.damages}
                                    coords={imageCoords}
                                    onFindingClick={(index) => {
                                        findingRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                />

                                {/* Executive Summary Editor */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Sparkles className="size-4 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">Executive Summary</h3>
                                    </div>
                                    <div className="p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
                                        <textarea
                                            value={analysisResult.summary}
                                            onChange={(e) => setAnalysisResult({ ...analysisResult, summary: e.target.value })}
                                            className="w-full bg-[#0a0f1d] border-none rounded-[22px] p-8 text-xl leading-relaxed text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y min-h-[180px]"
                                            placeholder="Enter the high-level summary of the inspection..."
                                        />
                                    </div>
                                </section>

                                {/* Findings Editor */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <Target className="size-4 text-orange-500" />
                                            </div>
                                            <h3 className="text-xl font-bold">Detected Anomalies</h3>
                                        </div>
                                        <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-full opacity-50 uppercase tracking-widest">
                                            {analysisResult.damages.length} Total Findings
                                        </span>
                                    </div>

                                    <div className="grid gap-12">
                                        {analysisResult.damages.map((damage: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                ref={(el: any) => { findingRefs.current[i] = el; }}
                                                layout
                                                className="grid lg:grid-cols-[1fr,450px] gap-8 p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all relative group"
                                            >
                                                {/* Visual Preview */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Visual Context</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] text-muted-foreground/40 italic">Image {damage.imageIndex + 1}</span>
                                                            <div className={cn(
                                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm",
                                                                damage.severity === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                    damage.severity === 'High' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                                        damage.severity === 'Medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                            )}>
                                                                {damage.severity} Priority
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        {reviewMode !== 'measure' ? (
                                                            <ImageOverlay
                                                                imageSrc={analyzedImages[damage.imageIndex]}
                                                                damages={[damage]}
                                                                showAllPolygons={reviewMode === 'detail'}
                                                                assetPolygon={analysisResult.assetPolygon}
                                                                visionMode={visionMode}
                                                                isMarkupMode={reviewMode === 'markup'}
                                                                onUpdateAnnotations={(annos) => {
                                                                    const newDamages = [...analysisResult.damages];
                                                                    newDamages[i] = { ...newDamages[i], annotations: annos };
                                                                    setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                                }}
                                                            />
                                                        ) : (
                                                            <MeasurementOverlay
                                                                imageSrc={analyzedImages[damage.imageIndex]}
                                                                pixelsPerMeter={imageScales[damage.imageIndex]}
                                                                isCalibrating={isCalibrating === damage.imageIndex}
                                                                isMeasuring={reviewMode === 'measure' && isCalibrating !== damage.imageIndex}
                                                                onCalibrate={(ppm) => {
                                                                    setImageScales(prev => ({ ...prev, [damage.imageIndex]: ppm }));
                                                                    setIsCalibrating(null);
                                                                }}
                                                                onAddMeasurement={(len: number, p1: any, p2: any, label?: string) => {
                                                                    const newDamages = [...analysisResult.damages];
                                                                    if (!newDamages[i].measurements) newDamages[i].measurements = [];
                                                                    newDamages[i].measurements.push({ length: len, p1, p2, label });
                                                                    setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                                }}
                                                            />
                                                        )}

                                                        {reviewMode === 'measure' && !imageScales[damage.imageIndex] && isCalibrating !== damage.imageIndex && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-2xl">
                                                                <Ruler className="size-12 text-primary opacity-50" />
                                                                <div>
                                                                    <h4 className="text-lg font-bold">Calibration Required</h4>
                                                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">To perform measurements, you must first define the scale for this asset.</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setIsCalibrating(damage.imageIndex)}
                                                                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                                                >
                                                                    Calibrate Scaling
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Zoom Detail Visualization */}
                                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest block">Report Detail View</span>
                                                                {reviewMode === 'measure' && imageScales[damage.imageIndex] && (
                                                                    <button
                                                                        onClick={() => setIsCalibrating(damage.imageIndex)}
                                                                        className="text-primary hover:text-white transition-colors"
                                                                    >
                                                                        <Ruler className="size-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="aspect-square rounded-xl overflow-hidden border border-white/10 relative bg-slate-900">
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                                    <Target className="size-12" />
                                                                </div>
                                                                <div
                                                                    className="absolute inset-0 w-full h-full"
                                                                    style={{
                                                                        backgroundImage: `url(${analyzedImages[damage.imageIndex]})`,
                                                                        backgroundSize: '400%', // 4x Zoom
                                                                        backgroundPosition: `${damage.focalPoint[1] / 10}% ${damage.focalPoint[0] / 10}%`,
                                                                        backgroundRepeat: 'no-repeat'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest block">Defect Evolution</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setLinkingFindingIndex(i);
                                                                        setIsLinkingModalOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group/btn"
                                                                >
                                                                    <HistoryIcon className="size-3 transition-transform group-hover/btn:rotate-[-45deg]" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Evolve Finding</span>
                                                                </button>
                                                            </div>
                                                            <div className="aspect-square rounded-xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center p-4 text-center">
                                                                {damage.comparisonData ? (
                                                                    <div className="space-y-4">
                                                                        <div className={cn(
                                                                            "size-12 rounded-full flex items-center justify-center border-2",
                                                                            damage.comparisonData.status === 'Growing' ? "bg-red-500/10 border-red-500/30 text-red-500" :
                                                                                damage.comparisonData.status === 'Stable' ? "bg-green-500/10 border-green-500/30 text-green-500" :
                                                                                    "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                                                        )}>
                                                                            {damage.comparisonData.status === 'Growing' ? <TrendingUp className="size-6" /> :
                                                                                damage.comparisonData.status === 'Stable' ? <Minus className="size-6" /> :
                                                                                    <Sparkles className="size-6" />}
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-xs font-black uppercase text-white">Linked</h5>
                                                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                                                Tracking established across surveys
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newDamages = [...analysisResult.damages];
                                                                                delete newDamages[i].parentFindingId;
                                                                                delete newDamages[i].comparisonData;
                                                                                setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                                            }}
                                                                            className="text-[8px] font-bold text-muted-foreground hover:text-red-400 uppercase tracking-widest flex items-center gap-1 mx-auto"
                                                                        >
                                                                            <Unlink className="size-2.5" />
                                                                            Unlink History
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-3 opacity-40">
                                                                        <HistoryIcon className="size-8 mx-auto text-muted-foreground" />
                                                                        <p className="text-[9px] leading-relaxed text-muted-foreground">Link to previous survey to track growth over time.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Data Editor Card */}
                                                <div className="bg-black/40 rounded-3xl border border-white/10 p-8 space-y-6 shadow-3xl flex flex-col">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Finding Title</label>
                                                        <input
                                                            value={damage.title}
                                                            onChange={(e) => {
                                                                const newDamages = [...analysisResult.damages];
                                                                newDamages[i].title = e.target.value;
                                                                setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                            }}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Severity</label>
                                                            <select
                                                                value={damage.severity}
                                                                onChange={(e) => {
                                                                    const newDamages = [...analysisResult.damages];
                                                                    newDamages[i].severity = e.target.value;
                                                                    setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                                                            >
                                                                <option value="Low">Low</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="High">High</option>
                                                                <option value="Critical">Critical</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Condition</label>
                                                            <select
                                                                value={damage.conditionRating}
                                                                onChange={(e) => {
                                                                    const newDamages = [...analysisResult.damages];
                                                                    newDamages[i].conditionRating = e.target.value;
                                                                    setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                                                            >
                                                                <option value="Excellent">Excellent</option>
                                                                <option value="Good">Good</option>
                                                                <option value="Fair">Fair</option>
                                                                <option value="Poor">Poor</option>
                                                                <option value="Critical">Critical</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Location / Component</label>
                                                        <input
                                                            value={damage.component}
                                                            onChange={(e) => {
                                                                const newDamages = [...analysisResult.damages];
                                                                newDamages[i].component = e.target.value;
                                                                setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                            }}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 flex-1">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Description</label>
                                                        <textarea
                                                            value={damage.description}
                                                            onChange={(e) => {
                                                                const newDamages = [...analysisResult.damages];
                                                                newDamages[i].description = e.target.value;
                                                                setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                            }}
                                                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                                                        />
                                                    </div>

                                                    <div className="pt-4 border-t border-white/5 mt-auto">
                                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 mb-2 block">Recommendation</label>
                                                        <input
                                                            value={damage.recommendation}
                                                            onChange={(e) => {
                                                                const newDamages = [...analysisResult.damages];
                                                                newDamages[i].recommendation = e.target.value;
                                                                setAnalysisResult({ ...analysisResult, damages: newDamages });
                                                            }}
                                                            className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                                            placeholder="AI Recommendation..."
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* Final Build Actions */}
                                <div className="flex justify-between items-center py-20 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href="/dashboard"
                                            className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                        >
                                            <LayoutDashboard className="size-4" />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleSaveToDashboard}
                                            className="px-6 py-3 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Save to Dashboard
                                        </button>
                                        <button
                                            onClick={handleDownloadPdf}
                                            disabled={isGeneratingPdf}
                                            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                                        >
                                            <FileText className="size-4" />
                                            {isGeneratingPdf ? 'Generating PDF...' : 'Finalize & Export'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
