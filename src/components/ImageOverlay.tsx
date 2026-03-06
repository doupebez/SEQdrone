'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MessageSquare, X, Check, Type, Zap, Thermometer } from 'lucide-react';

export interface Annotation {
    type: 'path' | 'zone' | 'note' | 'thermal';
    points: number[][]; // [[y, x], ...] normalized 0-1000
    color: string;
    label?: string;
    text?: string;
    temperature?: number; // For thermal anomalies
}

export interface Damage {
    title: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    boundingBox?: number[];
    polygon?: number[][];
    focalPoint: number[]; // [y, x] 0-1000
    annotations?: Annotation[];
}

interface ImageOverlayProps {
    imageSrc: string;
    damages: Damage[];
    showAllPolygons?: boolean;
    assetPolygon?: number[][];
    visionMode?: 'visual' | 'thermal';
    isMarkupMode?: boolean;
    onUpdateAnnotations?: (annotations: Annotation[]) => void;
}

export function ImageOverlay({
    imageSrc,
    damages,
    showAllPolygons = false,
    assetPolygon,
    visionMode: externalVisionMode,
    isMarkupMode = false,
    onUpdateAnnotations
}: ImageOverlayProps) {
    const [activeDamage, setActiveDamage] = useState<number | null>(null);
    const [internalVisionMode, setInternalVisionMode] = useState<'visual' | 'thermal'>('visual');
    const [currentPath, setCurrentPath] = useState<number[][]>([]);
    const [activeColor, setActiveColor] = useState<string>('#22c55e'); // Emerald-500
    const [activeTool, setActiveTool] = useState<'path' | 'note' | 'thermal'>('path');
    const [pendingNote, setPendingNote] = useState<{ y: number, x: number } | null>(null);
    const [pendingPath, setPendingPath] = useState<number[][] | null>(null);
    const [pendingThermal, setPendingThermal] = useState<{ y: number, x: number } | null>(null);
    const [noteText, setNoteText] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [tempValue, setTempValue] = useState('45');
    const containerRef = useRef<HTMLDivElement>(null);

    const visionMode = externalVisionMode || internalVisionMode;

    const getColor = (s: string) => {
        switch (s) {
            case 'Critical': return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)', className: 'bg-red-500', shadow: 'shadow-red-500/50' };
            case 'High': return { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.15)', className: 'bg-orange-500', shadow: 'shadow-orange-500/50' };
            case 'Medium': return { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.15)', className: 'bg-yellow-500', shadow: 'shadow-yellow-500/50' };
            default: return { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', className: 'bg-blue-500', shadow: 'shadow-blue-500/50' };
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isMarkupMode) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;

        if (activeTool === 'note') {
            setPendingNote({ y, x });
            return;
        }

        if (activeTool === 'thermal') {
            setPendingThermal({ y, x });
            return;
        }

        setCurrentPath([[y, x]]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isMarkupMode || activeTool !== 'path' || currentPath.length === 0) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;
        setCurrentPath(prev => [...prev, [y, x]]);
    };

    const handlePointerUp = () => {
        if (!isMarkupMode || activeTool !== 'path' || currentPath.length === 0) return;

        // Open naming modal for the path
        setPendingPath(currentPath);
        setCustomLabel(activeColor === '#22c55e' ? 'SAFE ACCESS' : 'EXCLUSION ZONE');
        setCurrentPath([]);
    };

    const handleSavePath = () => {
        if (!pendingPath) return;

        const newAnnotation: Annotation = {
            type: 'path',
            points: pendingPath,
            color: activeColor,
            label: customLabel.toUpperCase() || (activeColor === '#22c55e' ? 'SAFE ACCESS' : 'EXCLUSION ZONE')
        };

        const existingAnnotations = damages[0]?.annotations || [];
        onUpdateAnnotations?.([...existingAnnotations, newAnnotation]);
        setPendingPath(null);
        setCustomLabel('');
    };

    const handleAddNote = () => {
        if (!pendingNote || !noteText) return;

        const newAnnotation: Annotation = {
            type: 'note',
            points: [[pendingNote.y, pendingNote.x]],
            color: '#3b82f6', // Professional blue for notes
            text: noteText
        };

        const existingAnnotations = damages[0]?.annotations || [];
        onUpdateAnnotations?.([...existingAnnotations, newAnnotation]);
        setPendingNote(null);
        setNoteText('');
    };

    const handleAddThermal = () => {
        if (!pendingThermal || !tempValue) return;

        const newAnnotation: Annotation = {
            type: 'thermal',
            points: [[pendingThermal.y, pendingThermal.x]],
            color: '#f97316', // Heat orange
            temperature: parseFloat(tempValue),
            label: `${tempValue}°C`
        };

        const existingAnnotations = damages[0]?.annotations || [];
        onUpdateAnnotations?.([...existingAnnotations, newAnnotation]);
        setPendingThermal(null);
        setTempValue('45');
    };

    return (
        <div
            className={cn(
                "relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl group flex items-center justify-center touch-none",
                isMarkupMode ? "cursor-crosshair ring-2 ring-primary ring-offset-4 ring-offset-black" : ""
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* SVG Filter Definitions */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <filter id="thermal-vision">
                        {/* Convert to grayscale first */}
                        <feColorMatrix type="saturate" values="0" />
                        {/* Map whites to yellow/orange, mids to red/purple, darks to deep blue */}
                        <feComponentTransfer>
                            <feFuncR type="table" tableValues="0.1 0.4 1 1 1" />
                            <feFuncG type="table" tableValues="0.0 0.1 0.2 0.8 1" />
                            <feFuncB type="table" tableValues="0.3 0.8 0.2 0.0 0.5" />
                        </feComponentTransfer>
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="1.5" intercept="-0.1" />
                            <feFuncG type="linear" slope="1.2" intercept="-0.1" />
                            <feFuncB type="linear" slope="1.1" intercept="-0.1" />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>

            {imageSrc && (
                <Image
                    src={imageSrc}
                    alt="Analyzed Survey"
                    fill
                    className={cn(
                        "object-contain transition-all duration-700 pointer-events-none",
                        visionMode === 'thermal' ? "brightness-125 contrast-125 scale-[1.01]" : ""
                    )}
                    style={{
                        filter: visionMode === 'thermal' ? 'url(#thermal-vision)' : 'none'
                    }}
                />
            )}

            {/* Markup Tooling */}
            {isMarkupMode && (
                <div
                    className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTool('path')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                activeTool === 'path' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Type className="size-3 rotate-45" />
                            Path
                        </button>
                        <button
                            onClick={() => setActiveTool('thermal')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                activeTool === 'thermal' ? "bg-orange-500/20 text-orange-400" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <Zap className="size-3" />
                            Thermal
                        </button>
                        <button
                            onClick={() => setActiveTool('note')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                activeTool === 'note' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <MessageSquare className="size-3" />
                            Note
                        </button>
                    </div>

                    <div className="h-px w-full bg-white/5" />

                    <div className="flex items-center gap-2">
                        {activeTool === 'path' && (
                            <>
                                <button
                                    onClick={() => setActiveColor('#22c55e')}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all",
                                        activeColor === '#22c55e' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    Safe
                                </button>
                                <button
                                    onClick={() => setActiveColor('#ef4444')}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all",
                                        activeColor === '#ef4444' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    Danger
                                </button>
                            </>
                        )}
                        <div className="flex-1" />
                        <button
                            onClick={() => onUpdateAnnotations?.([])}
                            className="px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Path Naming Popup */}
            {pendingPath && (
                <div
                    className="absolute z-[60] p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-3 min-w-[240px] animate-in zoom-in-95 duration-200"
                    style={{
                        top: `${(pendingPath[pendingPath.length - 1][0] / 1000) * 100}%`,
                        left: `${(pendingPath[pendingPath.length - 1][1] / 1000) * 100}%`,
                        transform: 'translate(-50%, 20px)'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Label Action Path</span>
                        <button onClick={() => setPendingPath(null)}><X className="size-3 text-slate-500" /></button>
                    </div>
                    <input
                        autoFocus
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                        placeholder="e.g. REPAIR ACCESS"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePath();
                        }}
                    />
                    <button
                        onClick={handleSavePath}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Check className="size-3" />
                        Confirm Label
                    </button>
                </div>
            )}

            {/* Thermal Anomaly Popup */}
            {pendingThermal && (
                <div
                    className="absolute z-[60] p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-3 min-w-[200px] animate-in zoom-in-95 duration-200"
                    style={{
                        top: `${(pendingThermal.y / 1000) * 100}%`,
                        left: `${(pendingThermal.x / 1000) * 100}%`,
                        transform: 'translate(-50%, 20px)'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Record Hotspot Temp</span>
                        <button onClick={() => setPendingThermal(null)}><X className="size-3 text-slate-500" /></button>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                        <input
                            autoFocus
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-full bg-transparent border-none text-xs text-white focus:outline-none font-bold"
                            placeholder="45"
                        />
                        <span className="text-[10px] font-black text-slate-500">°C</span>
                    </div>
                    <button
                        onClick={handleAddThermal}
                        className="w-full bg-orange-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                        <Zap className="size-3" />
                        Save Anomaly
                    </button>
                </div>
            )}

            {/* Note Entry Popup */}
            {pendingNote && (
                <div
                    className="absolute z-50 p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-3 min-w-[240px] animate-in zoom-in-95 duration-200"
                    style={{
                        top: `${(pendingNote.y / 1000) * 100}%`,
                        left: `${(pendingNote.x / 1000) * 100}%`,
                        transform: 'translate(-50%, 20px)'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Add Note</span>
                        <button onClick={() => setPendingNote(null)}><X className="size-3 text-slate-500" /></button>
                    </div>
                    <textarea
                        autoFocus
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary h-24 resize-none"
                        placeholder="Type your observation here..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleAddNote();
                        }}
                    />
                    <button
                        onClick={handleAddNote}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Check className="size-3" />
                        Save Annotation
                    </button>
                </div>
            )}

            {/* Vision Mode Switcher (only shown if not controlled externally) */}
            {!externalVisionMode && !isMarkupMode && (
                <div className="absolute bottom-6 left-6 z-40 flex bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button
                        onClick={() => setInternalVisionMode('visual')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            visionMode === 'visual' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Visual
                    </button>
                    <button
                        onClick={() => setInternalVisionMode('thermal')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            visionMode === 'thermal' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Thermal
                    </button>
                </div>
            )}

            {/* Centered Overlay Container matching image aspect ratio */}
            <div className="absolute inset-0 flex items-center justify-center" ref={containerRef}>
                <div className="relative aspect-[4/3] w-full h-full">
                    {/* SVG Layer for Polygons & Markup */}
                    <svg
                        viewBox="0 0 1000 1000"
                        className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-2xl"
                        preserveAspectRatio="none"
                    >
                        {/* Asset Total Boundary */}
                        {assetPolygon && assetPolygon.length >= 3 && (
                            <polygon
                                points={assetPolygon.map(p => `${p[1]},${p[0]}`).join(' ')}
                                stroke="#54BC2F"
                                strokeWidth="2"
                                strokeDasharray="10,5"
                                fill="rgba(84, 188, 47, 0.05)"
                                className="opacity-60"
                            />
                        )}


                        {/* Pilot Markups (SVG Paths) */}
                        {damages[0]?.annotations?.map((anno, idx) => {
                            if (anno.type === 'note') return null; // Rendered as HTML markers instead
                            return (
                                <g key={`anno-${idx}`}>
                                    <polyline
                                        points={anno.points.map(p => `${p[1]},${p[0]}`).join(' ')}
                                        fill="none"
                                        stroke={anno.color}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray={anno.type === 'zone' ? "10,10" : "0"}
                                        className="opacity-80"
                                    />
                                    <text
                                        x={anno.points[0][1]}
                                        y={anno.points[0][0] - 10}
                                        fill={anno.color}
                                        fontSize="12"
                                        fontWeight="900"
                                        className="uppercase tracking-widest"
                                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                                    >
                                        {anno.label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Active Drawing Path */}
                        {currentPath.length > 1 && (
                            <polyline
                                points={currentPath.map(p => `${p[1]},${p[0]}`).join(' ')}
                                fill="none"
                                stroke={activeColor}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-50"
                            />
                        )}
                    </svg>

                    {/* Markers Layer - Must be identical layout to SVG for alignment */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* We wrap markers in a container that mirrors the SVG's 'xMidYMid meet' behavior if possible, 
                            but since coordinates are normalized 0-1000, we simply need a 1:1 overlay. */}
                        <div className="relative w-full h-full">
                            {!isMarkupMode && damages.map((damage, i) => {
                                const color = getColor(damage.severity);
                                const top = `${(damage.focalPoint[0] / 1000) * 100}%`;
                                const left = `${(damage.focalPoint[1] / 1000) * 100}%`;

                                return (
                                    <div
                                        key={i}
                                        style={{ top, left }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                                        onMouseEnter={() => setActiveDamage(i)}
                                        onMouseLeave={() => setActiveDamage(null)}
                                    >
                                        {/* Focal Pin Marker */}
                                        <div className={cn(
                                            "group relative flex items-center justify-center transition-all duration-300",
                                            activeDamage === i ? "scale-125" : "scale-100"
                                        )}>
                                            {/* Pulse Effect */}
                                            <div className={cn(
                                                "absolute inset-0 rounded-full animate-ping opacity-20",
                                                color.className
                                            )} />

                                            {/* Inner Pin */}
                                            <div className={cn(
                                                "size-3.5 rounded-full border-2 border-white shadow-xl ring-2 ring-black/50",
                                                color.className,
                                                color.shadow
                                            )} />

                                            {/* Label Tooltip */}
                                            <div className={cn(
                                                "absolute left-full ml-3 px-3 py-1.5 bg-black/95 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10 whitespace-nowrap backdrop-blur-md transition-all transform origin-left z-50",
                                                activeDamage === i ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-2 scale-90 pointer-events-none"
                                            )}>
                                                {damage.title}
                                                <div className="text-[8px] opacity-70 mt-0.5 font-normal normal-case">{damage.severity} Priority</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pilot Notes & Thermal Anomaly Markers (HTML Overlays) */}
                            {damages[0]?.annotations?.filter(a => a.type === 'note' || a.type === 'thermal').map((anno, idx) => (
                                <div
                                    key={`marker-${idx}`}
                                    style={{
                                        top: `${(anno.points[0][0] / 1000) * 100}%`,
                                        left: `${(anno.points[0][1] / 1000) * 100}%`
                                    }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                                >
                                    <div className="group relative">
                                        {anno.type === 'note' ? (
                                            <>
                                                <div className="size-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
                                                    <MessageSquare className="size-3" />
                                                </div>
                                                <div className="absolute left-full ml-3 top-0 px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-[10px] text-white whitespace-pre-wrap max-w-[200px] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Pilot Note</div>
                                                    {anno.text}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="size-6 rounded-full bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center text-white shadow-orange-500/40">
                                                    <Thermometer className="size-3" />
                                                </div>
                                                <div className="absolute left-full ml-3 top-0 px-3 py-2 bg-black/95 border border-orange-500/30 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Zap className="size-2 text-orange-400" />
                                                        <div className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Thermal Anomaly</div>
                                                    </div>
                                                    <div className="text-sm font-bold">{anno.temperature}°C</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
