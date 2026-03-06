'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Ruler, Check, X, MoveHorizontal, Pointer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Point {
    x: number;
    y: number;
}

interface MeasurementOverlayProps {
    imageSrc: string;
    onCalibrate: (pixelsPerMeter: number) => void;
    onAddMeasurement: (length: number, p1: Point, p2: Point) => void;
    isCalibrating: boolean;
    isMeasuring: boolean;
    pixelsPerMeter?: number;
}

export function MeasurementOverlay({
    imageSrc,
    onCalibrate,
    onAddMeasurement,
    isCalibrating,
    isMeasuring,
    pixelsPerMeter
}: MeasurementOverlayProps) {
    const [p1, setP1] = useState<Point | null>(null);
    const [p2, setP2] = useState<Point | null>(null);
    const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
    const [calibrationValue, setCalibrationValue] = useState<string>("1.0");
    const [measurementLabel, setMeasurementLabel] = useState<string>("");
    const [isNaming, setIsNaming] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isCalibrating && !isMeasuring || isNaming) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;

        if (!p1) {
            setP1({ x, y });
        } else if (!p2) {
            setP2({ x, y });
        } else {
            setP1({ x, y });
            setP2(null);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isCalibrating && !isMeasuring || isNaming) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;
        setCurrentPoint({ x, y });
    };

    const calculateDistance = (pt1: Point, pt2: Point) => {
        return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    };

    const handleConfirm = () => {
        if (!p1 || !p2) return;
        const pixelDist = calculateDistance(p1, p2);

        if (isCalibrating) {
            const realDistVal = parseFloat(calibrationValue);
            if (!isNaN(realDistVal) && realDistVal > 0) {
                const ppm = pixelDist / realDistVal;
                onCalibrate(ppm);
                setP1(null);
                setP2(null);
            }
        } else if (isMeasuring && pixelsPerMeter) {
            setIsNaming(true);
            setMeasurementLabel(`Defect Measurement ${Math.floor(Math.random() * 100)}`);
        }
    };

    const handleSaveMeasurement = () => {
        if (!p1 || !p2 || !pixelsPerMeter) return;
        const pixelDist = calculateDistance(p1, p2);
        const realDist = pixelDist / pixelsPerMeter;

        // Pass label to parent
        (onAddMeasurement as any)(realDist, p1, p2, measurementLabel.toUpperCase());

        setIsNaming(false);
        setMeasurementLabel("");
        setP1(null);
        setP2(null);
    };

    return (
        <div
            className={cn(
                "relative aspect-video w-full rounded-2xl overflow-hidden bg-black/50 group touch-none flex items-center justify-center",
                (isCalibrating || isMeasuring) ? "ring-2 ring-primary ring-offset-4 ring-offset-black" : ""
            )}
        >
            {imageSrc && (
                <img src={imageSrc} className="w-full h-full object-contain pointer-events-none select-none" alt="Survey View" />
            )}

            {/* Interactive Layer - Centered to match object-contain */}
            <div
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center cursor-crosshair h-full w-full"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            >
                <div className="relative aspect-video w-full h-full">
                    {/* SVG Layer for Ruler */}
                    <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                        {p1 && (
                            <circle cx={p1.x} cy={p1.y} r="6" fill="#54BC2F" />
                        )}
                        {p2 && (
                            <circle cx={p2.x} cy={p2.y} r="6" fill="#54BC2F" />
                        )}
                        {p1 && (currentPoint || p2) && (
                            <g>
                                <line
                                    x1={p1.x} y1={p1.y}
                                    x2={p2 ? p2.x : currentPoint?.x}
                                    y2={p2 ? p2.y : currentPoint?.y}
                                    stroke="#54BC2F"
                                    strokeWidth="3"
                                    strokeDasharray="10,5"
                                />
                                <text
                                    x={((p1.x + (p2 ? p2.x : currentPoint!.x)) / 2)}
                                    y={((p1.y + (p2 ? p2.y : currentPoint!.y)) / 2) - 10}
                                    className="fill-white text-[14px] font-bold"
                                    textAnchor="middle"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                                >
                                    {p2 && pixelsPerMeter ? `${(calculateDistance(p1, p2) / pixelsPerMeter).toFixed(2)}m` : 'Calculating...'}
                                </text>
                            </g>
                        )}
                    </svg>
                </div>
            </div>

            {/* Naming Popup for Measurement */}
            {isNaming && p1 && p2 && (
                <div
                    className="absolute z-[60] p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl space-y-3 min-w-[240px] animate-in zoom-in-95 duration-200"
                    style={{
                        top: `${(p2.y / 1000) * 100}%`,
                        left: `${(p2.x / 1000) * 100}%`,
                        transform: 'translate(-50%, 20px)'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Label Measurement</span>
                        <button onClick={() => setIsNaming(false)}><X className="size-3 text-slate-500" /></button>
                    </div>
                    <input
                        autoFocus
                        value={measurementLabel}
                        onChange={(e) => setMeasurementLabel(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                        placeholder="e.g. CRACK LENGTH"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveMeasurement();
                        }}
                    />
                    <button
                        onClick={handleSaveMeasurement}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Check className="size-3" />
                        Confirm Measurement
                    </button>
                </div>
            )}

            {/* Instruction Banner */}
            {(isCalibrating || isMeasuring) && !isNaming && (
                <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl z-50"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent resetting points when clicking UI
                >
                    <Ruler className="size-4 text-primary animate-pulse" />
                    <span className="text-xs font-bold tracking-tight">
                        {isCalibrating ? (p1 && p2 ? "Confirm distance" : "Select two points to define scale") : "Draw line to measure defect"}
                    </span>

                    {isCalibrating && p1 && p2 && (
                        <div className="ml-2 flex items-center bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                            <input
                                type="text"
                                value={calibrationValue}
                                onChange={(e) => setCalibrationValue(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-[10px] font-bold text-white w-12 text-center"
                                autoFocus
                            />
                            <span className="text-[10px] text-muted-foreground mr-1">m</span>
                        </div>
                    )}

                    {(p1 && p2) && (
                        <button
                            onClick={handleConfirm}
                            className="ml-2 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                            <Check className="size-3" />
                            Confirm
                        </button>
                    )}
                    <button onClick={() => { setP1(null); setP2(null); }} className="p-1 hover:text-red-500 transition-colors">
                        <X className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
