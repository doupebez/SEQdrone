'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    Brain,
    ChevronDown,
    ChevronRight,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Sparkles,
    Loader2,
    MessageSquarePlus,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Send,
    LayoutDashboard,
    ArrowLeft,
    Zap,
    Target,
    BookOpen,
    ListChecks,
    Plus,
    RefreshCw
} from 'lucide-react';
import { storage, SurveyRecord, trainingStorage, TrainingFeedback, TrainingRule } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

const CATEGORY_OPTIONS = [
    { value: 'false_positive', label: 'False Positive', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { value: 'missed_defect', label: 'Missed Defect', icon: EyeOff, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { value: 'wrong_severity', label: 'Wrong Severity', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { value: 'wrong_category', label: 'Wrong Category', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { value: 'good_detection', label: 'Good Detection', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { value: 'general', label: 'General Note', icon: MessageSquarePlus, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
] as const;

export default function TrainingPage() {
    const { user } = useAuth();
    const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
    const [feedback, setFeedback] = useState<TrainingFeedback[]>([]);
    const [rules, setRules] = useState<TrainingRule[]>([]);
    const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
    const [isDistilling, setIsDistilling] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [newCategory, setNewCategory] = useState<TrainingFeedback['category']>('general');
    const [newRuleText, setNewRuleText] = useState('');
    const [activeTab, setActiveTab] = useState<'analyses' | 'rules'>('analyses');

    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            const allSurveys = await storage.getHistory(user.id);
            setSurveys(allSurveys.slice(0, 20));
            setFeedback(await trainingStorage.getAllFeedback(user.id));
            setRules(await trainingStorage.getAllRules(user.id));
        };
        loadData();
    }, [user]);

    const handleSubmitFeedback = async (surveyId: string, surveyTitle: string, findingId?: string, findingTitle?: string) => {
        if (!newComment.trim() || !user) return;

        const entry: TrainingFeedback = {
            id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            surveyId,
            surveyTitle,
            findingId,
            findingTitle,
            comment: newComment.trim(),
            category: newCategory,
            createdAt: new Date().toISOString(),
        };

        await trainingStorage.saveFeedback(entry, user.id);
        setFeedback(await trainingStorage.getAllFeedback(user.id));
        setNewComment('');
        setNewCategory('general');
    };

    const handleDeleteFeedback = async (id: string) => {
        if (!user) return;
        await trainingStorage.deleteFeedback(id);
        setFeedback(await trainingStorage.getAllFeedback(user.id));
    };

    const handleDistillRules = async () => {
        if (feedback.length === 0) return;
        setIsDistilling(true);

        try {
            const response = await fetch('/api/training', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackEntries: feedback }),
            });

            if (!response.ok) throw new Error('Failed to distill rules');

            const data = await response.json();

            const newRules: TrainingRule[] = data.rules.map((r: any) => ({
                id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                rule: r.rule,
                source: r.source,
                createdAt: new Date().toISOString(),
                active: true,
            }));

            // Replace all rules with the newly distilled ones
            if (user) await trainingStorage.setAllRules(newRules, user.id);
            setRules(newRules);
            setActiveTab('rules');
        } catch (error) {
            console.error('Failed to distill rules:', error);
            alert('Failed to generate training rules. Please try again.');
        } finally {
            setIsDistilling(false);
        }
    };

    const handleToggleRule = async (id: string) => {
        if (!user) return;
        const rule = rules.find(r => r.id === id);
        if (rule) await trainingStorage.toggleRule(id, rule.active);
        setRules(await trainingStorage.getAllRules(user.id));
    };

    const handleDeleteRule = async (id: string) => {
        if (!user) return;
        await trainingStorage.deleteRule(id);
        setRules(await trainingStorage.getAllRules(user.id));
    };

    const handleAddManualRule = async () => {
        if (!newRuleText.trim() || !user) return;
        const rule: TrainingRule = {
            id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            rule: newRuleText.trim(),
            source: 'Manually added',
            createdAt: new Date().toISOString(),
            active: true,
        };
        await trainingStorage.saveRule(rule, user.id);
        setRules(await trainingStorage.getAllRules(user.id));
        setNewRuleText('');
    };

    const severityColor = (s: string) => {
        switch (s) {
            case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    const activeRuleCount = rules.filter(r => r.active).length;
    const feedbackBySurvey = (surveyId: string) => feedback.filter(f => f.surveyId === surveyId);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-900/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/images/logo.png"
                            alt="SEQ Drone Inspections"
                            width={200}
                            height={50}
                            className="h-12 w-auto brightness-0 invert"
                            priority
                        />
                        <span className="text-slate-600 font-normal mx-1">/</span>
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                            <Brain className="size-3.5 text-purple-400" />
                            <span className="text-xs font-bold text-purple-300">Training Console</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                        >
                            <LayoutDashboard className="size-3.5" />
                            Dashboard
                        </Link>
                        <Link
                            href="/survey"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="size-3.5" />
                            New Survey
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-6 py-10 max-w-6xl">
                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-4xl font-black tracking-tight mb-3">
                        AI Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Console</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Review past analyses, provide corrections, and generate training rules that make the AI smarter with every inspection.
                    </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
                >
                    {[
                        { label: 'Analyses Available', value: surveys.length, icon: Target, gradient: 'from-blue-500/20 to-cyan-500/20' },
                        { label: 'Feedback Entries', value: feedback.length, icon: MessageSquarePlus, gradient: 'from-purple-500/20 to-pink-500/20' },
                        { label: 'Active Rules', value: activeRuleCount, icon: ShieldCheck, gradient: 'from-emerald-500/20 to-green-500/20' },
                        { label: 'Total Rules', value: rules.length, icon: BookOpen, gradient: 'from-orange-500/20 to-yellow-500/20' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${stat.gradient} border border-white/5 backdrop-blur-sm`}>
                            <stat.icon className="size-5 text-slate-400 mb-3" />
                            <div className="text-3xl font-black text-white">{stat.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="flex bg-white/5 p-1.5 rounded-full border border-white/5">
                        <button
                            onClick={() => setActiveTab('analyses')}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'analyses' ? "bg-primary text-primary-foreground shadow-xl" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Eye className="size-3.5" />
                            Past Analyses ({surveys.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'rules' ? "bg-primary text-primary-foreground shadow-xl" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <ListChecks className="size-3.5" />
                            Training Rules ({rules.length})
                        </button>
                    </div>

                    {activeTab === 'analyses' && feedback.length > 0 && (
                        <button
                            onClick={handleDistillRules}
                            disabled={isDistilling}
                            className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase tracking-widest hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-95"
                        >
                            {isDistilling ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Distilling...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-3.5" />
                                    Generate Rules from Feedback
                                </>
                            )}
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {/* ─── Analyses Tab ─── */}
                    {activeTab === 'analyses' && (
                        <motion.div
                            key="analyses"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {surveys.length === 0 ? (
                                <div className="text-center py-24 space-y-4">
                                    <Target className="size-16 text-slate-700 mx-auto" />
                                    <h3 className="text-xl font-bold text-slate-500">No Analyses Yet</h3>
                                    <p className="text-slate-600 text-sm max-w-md mx-auto">
                                        Run some drone inspections and save them to the dashboard. They&apos;ll appear here for review.
                                    </p>
                                    <Link
                                        href="/survey"
                                        className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                                    >
                                        <Plus className="size-3.5" />
                                        Start New Survey
                                    </Link>
                                </div>
                            ) : (
                                surveys.map((survey, surveyIdx) => {
                                    const isExpanded = expandedSurvey === survey.id;
                                    const surveyFeedback = feedbackBySurvey(survey.id);

                                    return (
                                        <motion.div
                                            key={survey.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: surveyIdx * 0.03 }}
                                            className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
                                        >
                                            {/* Survey Header */}
                                            <button
                                                onClick={() => setExpandedSurvey(isExpanded ? null : survey.id)}
                                                className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-all text-left"
                                            >
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                    (survey.healthScore ?? 100) >= 70 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                        (survey.healthScore ?? 100) >= 40 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                                            "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}>
                                                    <span className="text-xs font-black">{survey.healthScore ?? '—'}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-white truncate">{survey.jobData.title || 'Untitled Survey'}</h3>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 uppercase tracking-widest shrink-0">
                                                            {survey.findingCount} findings
                                                        </span>
                                                        {surveyFeedback.length > 0 && (
                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest shrink-0">
                                                                {surveyFeedback.length} feedback
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-slate-500">{new Date(survey.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        {survey.jobData.location && (
                                                            <span className="text-xs text-slate-600">• {survey.jobData.location}</span>
                                                        )}
                                                        <span className="text-xs text-slate-600">• {survey.jobData.type}</span>
                                                    </div>
                                                </div>

                                                <ChevronDown className={cn("size-5 text-slate-500 transition-transform shrink-0", isExpanded && "rotate-180")} />
                                            </button>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                                                            {/* Survey-level summary */}
                                                            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Summary</div>
                                                                <p className="text-sm text-slate-300 leading-relaxed">{survey.analysisResult.summary}</p>
                                                            </div>

                                                            {/* Survey-level feedback form */}
                                                            <div className="p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/10">
                                                                <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <MessageSquarePlus className="size-3" />
                                                                    Add General Feedback for This Analysis
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        value={newCategory}
                                                                        onChange={(e) => setNewCategory(e.target.value as TrainingFeedback['category'])}
                                                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer"
                                                                    >
                                                                        {CATEGORY_OPTIONS.map(opt => (
                                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input
                                                                        value={newComment}
                                                                        onChange={(e) => setNewComment(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSubmitFeedback(survey.id, survey.jobData.title);
                                                                        }}
                                                                        placeholder="e.g. The AI missed obvious moss growth on the south tiles..."
                                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSubmitFeedback(survey.id, survey.jobData.title)}
                                                                        disabled={!newComment.trim()}
                                                                        className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 flex items-center gap-1.5"
                                                                    >
                                                                        <Send className="size-3" />
                                                                        Send
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Findings List */}
                                                            <div className="space-y-2">
                                                                {survey.analysisResult.damages.map((damage, dIdx) => {
                                                                    const findingKey = `${survey.id}-${damage.id}`;
                                                                    const isFindingExpanded = expandedFinding === findingKey;
                                                                    const findingFeedback = feedback.filter(f => f.findingId === damage.id);

                                                                    return (
                                                                        <div key={dIdx} className="rounded-xl border border-white/5 bg-black/20 overflow-hidden">
                                                                            <button
                                                                                onClick={() => setExpandedFinding(isFindingExpanded ? null : findingKey)}
                                                                                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-all text-left"
                                                                            >
                                                                                <div className="size-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                                                                    {dIdx + 1}
                                                                                </div>
                                                                                <span className="text-sm font-medium text-white flex-1 truncate">{damage.title}</span>
                                                                                <span className={cn(
                                                                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0",
                                                                                    severityColor(damage.severity)
                                                                                )}>
                                                                                    {damage.severity}
                                                                                </span>
                                                                                {findingFeedback.length > 0 && (
                                                                                    <span className="size-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-black text-purple-400 shrink-0">
                                                                                        {findingFeedback.length}
                                                                                    </span>
                                                                                )}
                                                                                <ChevronRight className={cn("size-3.5 text-slate-600 transition-transform shrink-0", isFindingExpanded && "rotate-90")} />
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {isFindingExpanded && (
                                                                                    <motion.div
                                                                                        initial={{ height: 0, opacity: 0 }}
                                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                        className="overflow-hidden"
                                                                                    >
                                                                                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                                                                                            {/* Finding Details */}
                                                                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                                                                <div>
                                                                                                    <span className="text-slate-500">Type:</span>
                                                                                                    <span className="ml-2 text-slate-300">{damage.defectType}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-slate-500">Component:</span>
                                                                                                    <span className="ml-2 text-slate-300">{damage.component}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-slate-500">Location:</span>
                                                                                                    <span className="ml-2 text-slate-300">{damage.areaLocation}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-slate-500">Confidence:</span>
                                                                                                    <span className="ml-2 text-slate-300">{damage.confidenceScore}%</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <p className="text-sm text-slate-400 leading-relaxed">{damage.description}</p>
                                                                                            <div className="text-xs text-primary font-medium">
                                                                                                <span className="text-slate-500">Recommendation:</span> {damage.recommendation}
                                                                                            </div>

                                                                                            {/* Existing feedback for this finding */}
                                                                                            {findingFeedback.length > 0 && (
                                                                                                <div className="space-y-2">
                                                                                                    <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Existing Feedback</div>
                                                                                                    {findingFeedback.map(fb => {
                                                                                                        const catInfo = CATEGORY_OPTIONS.find(c => c.value === fb.category);
                                                                                                        return (
                                                                                                            <div key={fb.id} className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/[0.05] border border-purple-500/10">
                                                                                                                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase border shrink-0 mt-0.5", catInfo?.bg)}>
                                                                                                                    {catInfo?.label}
                                                                                                                </span>
                                                                                                                <span className="text-xs text-slate-300 flex-1">{fb.comment}</span>
                                                                                                                <button
                                                                                                                    onClick={() => handleDeleteFeedback(fb.id)}
                                                                                                                    className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                                                                                                                >
                                                                                                                    <Trash2 className="size-3" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Finding-level feedback form */}
                                                                                            <div className="flex gap-2">
                                                                                                <select
                                                                                                    value={newCategory}
                                                                                                    onChange={(e) => setNewCategory(e.target.value as TrainingFeedback['category'])}
                                                                                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 appearance-none cursor-pointer"
                                                                                                >
                                                                                                    {CATEGORY_OPTIONS.map(opt => (
                                                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                <input
                                                                                                    value={newComment}
                                                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === 'Enter') handleSubmitFeedback(survey.id, survey.jobData.title, damage.id, damage.title);
                                                                                                    }}
                                                                                                    placeholder="Add feedback for this finding..."
                                                                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                                                                                                />
                                                                                                <button
                                                                                                    onClick={() => handleSubmitFeedback(survey.id, survey.jobData.title, damage.id, damage.title)}
                                                                                                    disabled={!newComment.trim()}
                                                                                                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-500 transition-all disabled:opacity-30 active:scale-95"
                                                                                                >
                                                                                                    <Send className="size-3" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                    {/* ─── Rules Tab ─── */}
                    {activeTab === 'rules' && (
                        <motion.div
                            key="rules"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Add Manual Rule */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Plus className="size-3" />
                                    Add Manual Rule
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        value={newRuleText}
                                        onChange={(e) => setNewRuleText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddManualRule(); }}
                                        placeholder="e.g. Always check the ridge cap for lifting when wind damage is present..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                    <button
                                        onClick={handleAddManualRule}
                                        disabled={!newRuleText.trim()}
                                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-30 active:scale-95"
                                    >
                                        Add Rule
                                    </button>
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/[0.05] border border-blue-500/10">
                                <Zap className="size-5 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-300 font-medium">Active rules are automatically injected into the AI's system prompt during every new analysis.</p>
                                    <p className="text-xs text-blue-400/60 mt-1">Toggle rules on/off to control what the AI learns from. Disabled rules are preserved but not used.</p>
                                </div>
                            </div>

                            {/* Rules List */}
                            {rules.length === 0 ? (
                                <div className="text-center py-20 space-y-4">
                                    <BookOpen className="size-16 text-slate-700 mx-auto" />
                                    <h3 className="text-xl font-bold text-slate-500">No Training Rules Yet</h3>
                                    <p className="text-slate-600 text-sm max-w-md mx-auto">
                                        Add feedback to past analyses, then click &quot;Generate Rules from Feedback&quot; to let the AI distill your corrections into reusable rules.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rules.map((rule, rIdx) => (
                                        <motion.div
                                            key={rule.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: rIdx * 0.03 }}
                                            className={cn(
                                                "flex items-start gap-4 p-5 rounded-2xl border transition-all",
                                                rule.active
                                                    ? "bg-emerald-500/[0.03] border-emerald-500/10"
                                                    : "bg-white/[0.01] border-white/5 opacity-50"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggleRule(rule.id)}
                                                className="shrink-0 mt-0.5"
                                            >
                                                {rule.active ? (
                                                    <ToggleRight className="size-7 text-emerald-400" />
                                                ) : (
                                                    <ToggleLeft className="size-7 text-slate-600" />
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm leading-relaxed", rule.active ? "text-slate-200" : "text-slate-500")}>
                                                    {rule.rule}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[9px] text-slate-600 font-medium">{rule.source}</span>
                                                    <span className="text-[9px] text-slate-700">•</span>
                                                    <span className="text-[9px] text-slate-600">{new Date(rule.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRule(rule.id)}
                                                className="shrink-0 text-slate-600 hover:text-red-400 transition-colors p-1"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Regenerate Rules Button */}
                            {feedback.length > 0 && rules.length > 0 && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={handleDistillRules}
                                        disabled={isDistilling}
                                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {isDistilling ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                                        Regenerate Rules from All Feedback ({feedback.length} entries)
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
