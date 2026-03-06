'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Target, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteMapViewProps {
    findings: any[];
    coords: { lat: number, lng: number }[];
    onFindingClick: (index: number) => void;
}

export function SiteMapView({ findings, coords, onFindingClick }: SiteMapViewProps) {
    // Calculate bounding box for the map view
    const validCoords = coords.filter(c => c.lat !== 0 && c.lng !== 0);

    if (validCoords.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-[32px] text-center space-y-4">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                    <MapPin className="size-8 text-muted-foreground opacity-20" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-400">No Geospatial Data Found</h4>
                    <p className="text-sm text-muted-foreground max-w-xs">Upload images with EXIF GPS metadata to enable industrial site mapping.</p>
                </div>
            </div>
        );
    }

    const minLat = Math.min(...validCoords.map(c => c.lat));
    const maxLat = Math.max(...validCoords.map(c => c.lat));
    const minLng = Math.min(...validCoords.map(c => c.lng));
    const maxLng = Math.max(...validCoords.map(c => c.lng));

    const latRange = maxLat - minLat || 0.0001;
    const lngRange = maxLng - minLng || 0.0001;

    // Normalize coordinates to 0-100 for the SVG viewbox
    const getPos = (lat: number, lng: number) => {
        const x = ((lng - minLng) / lngRange) * 80 + 10; // 10% padding
        const y = 100 - (((lat - minLat) / latRange) * 80 + 10); // Invert Y
        return { x, y };
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Site Intelligence</span>
                    <h4 className="text-lg font-bold">Geospatial Site Plan</h4>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-primary" />
                        <span>Survey Point</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                        <span>Detected Finding</span>
                    </div>
                </div>
            </div>

            <div className="relative aspect-[21/9] w-full rounded-[32px] border border-white/5 bg-[#0a0f1d] overflow-hidden group">
                {/* Radar Mock Grid */}
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 pointer-events-none opacity-10">
                    {Array.from({ length: 72 }).map((_, i) => (
                        <div key={i} className="border-[0.5px] border-primary/20" />
                    ))}
                </div>

                {/* Radial Pulse from Center */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
                    <div className="size-96 rounded-full border border-primary/5 animate-ping opacity-20" />
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full p-12">
                    {/* Survey Flight Path Mock */}
                    <polyline
                        points={validCoords.map(c => {
                            const { x, y } = getPos(c.lat, c.lng);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="rgba(163, 230, 53, 0.1)"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                    />

                    {/* Camera Trigger Points */}
                    {validCoords.map((c, i) => {
                        const { x, y } = getPos(c.lat, c.lng);
                        return (
                            <circle
                                key={`cam-${i}`}
                                cx={x}
                                cy={y}
                                r="0.8"
                                fill="rgba(163, 230, 53, 0.2)"
                            />
                        );
                    })}

                    {/* Finding Pins */}
                    {findings.map((f, i) => {
                        const coord = coords[f.imageIndex];
                        if (!coord || (coord.lat === 0 && coord.lng === 0)) return null;

                        const { x, y } = getPos(coord.lat, coord.lng);
                        return (
                            <motion.g
                                key={`finding-${i}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => onFindingClick(i)}
                                className="cursor-pointer group/pin"
                            >
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="2.5"
                                    className="fill-orange-500 animate-pulse opacity-40 hover:opacity-100 transition-opacity"
                                />
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="1.2"
                                    className="fill-orange-500"
                                />
                                <text
                                    x={x}
                                    y={y - 4}
                                    className="text-[3px] font-black fill-white text-center"
                                    textAnchor="middle"
                                >
                                    {i + 1}
                                </text>
                            </motion.g>
                        );
                    })}
                </svg>

                {/* Compass & Scale Controls */}
                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col items-center gap-4">
                        <button className="text-white hover:text-primary transition-colors"><ZoomIn className="size-4" /></button>
                        <div className="w-4 h-px bg-white/10" />
                        <button className="text-white hover:text-primary transition-colors"><Target className="size-4" /></button>
                    </div>
                </div>

                <div className="absolute top-6 left-6 flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Center Coord</div>
                    <div className="text-[12px] font-mono text-primary">
                        {((minLat + maxLat) / 2).toFixed(6)}, {((minLng + maxLng) / 2).toFixed(6)}
                    </div>
                </div>
            </div>
        </div>
    );
}
