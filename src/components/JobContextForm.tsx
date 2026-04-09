'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Home,
    Sun,
    Building2,
    Construction,
    Radio,
    Fan,
    Droplets,
    History,
    Plus
} from 'lucide-react';
import { storage, SurveyRecord } from '@/lib/storage';
import { useAuth } from '@/components/AuthProvider';

export interface JobData {
    id: string; // Survey ID
    assetId: string; // Persistent ID across surveys for same asset
    title: string;
    clientName: string;
    location: string;
    description: string;
    type: string;
}

interface JobContextFormProps {
    data: JobData;
    onChange: (field: keyof JobData, value: string) => void;
}

const JOB_TYPES = [
    {
        id: 'roof',
        label: 'Roof',
        icon: Home,
        description: 'Missing tiles, membrane damage, flashing issues'
    },
    {
        id: 'solar',
        label: 'Solar Panels',
        icon: Sun,
        description: 'Panel cracks, hotspots, soiling, delamination'
    },
    {
        id: 'facade',
        label: 'Building Facade',
        icon: Building2,
        description: 'Cracks, spalling, coating failure, water ingress'
    },
    {
        id: 'bridge',
        label: 'Bridge',
        icon: Construction,
        description: 'Bolt corrosion, concrete cracks, steel deterioration'
    },
    {
        id: 'tower',
        label: 'Comm Tower',
        icon: Radio,
        description: 'Dish alignment, structural integrity, corrosion'
    },
    {
        id: 'turbine',
        label: 'Wind Turbine',
        icon: Fan,
        description: 'Blade damage, erosion, tower corrosion'
    },
    {
        id: 'tank',
        label: 'Water Tank',
        icon: Droplets,
        description: 'Coating condition, corrosion, structural integrity'
    },
    {
        id: 'height-safety',
        label: 'Height Safety',
        icon: Construction,
        description: 'Anchor points, static lines, davit bases, fall arrest systems'
    },
];

export function JobContextForm({ data, onChange }: JobContextFormProps) {
    const { user } = useAuth();
    const [history, setHistory] = useState<SurveyRecord[]>([]);
    const [uniqueAssets, setUniqueAssets] = useState<{ assetId: string, title: string, client: string, location: string, type: string }[]>([]);

    useEffect(() => {
        if (!user) return;
        const loadHistory = async () => {
            const fullHistory = await storage.getHistory(user.id);
            setHistory(fullHistory);

            // Extract unique assets based on assetId
            const assetsMap = new Map<string, any>();
            fullHistory.forEach(record => {
                const assetId = record.jobData.assetId || 'legacy';
                if (!assetsMap.has(assetId)) {
                    assetsMap.set(assetId, {
                        assetId,
                        title: record.jobData.title,
                        client: record.jobData.clientName,
                        location: record.jobData.location,
                        type: record.jobData.type
                    });
                }
            });
            setUniqueAssets(Array.from(assetsMap.values()));
        };
        loadHistory();
    }, [user]);

    const handleSelectAsset = (asset: any) => {
        onChange('assetId', asset.assetId);
        onChange('title', asset.title);
        onChange('clientName', asset.client);
        onChange('location', asset.location);
        onChange('type', asset.type);
    };

    return (
        <div className="space-y-12 w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Existing Asset Quick-Link */}
            {uniqueAssets.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                        <History className="size-3" />
                        Existing Asset Detected
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {uniqueAssets.map((asset, idx) => (
                            <button
                                key={`asset-btn-${asset.assetId}-${idx}`}
                                onClick={() => handleSelectAsset(asset)}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl border transition-all text-xs flex items-center gap-3",
                                    data.assetId === asset.assetId
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                                )}
                            >
                                <Building2 className="size-3" />
                                {asset.title}
                            </button>
                        ))}
                        <button
                            onClick={() => onChange('assetId', `asset-${Date.now()}`)}
                            className="px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-slate-500 hover:text-white hover:border-white/40 transition-all text-xs flex items-center gap-2"
                        >
                            <Plus className="size-3" />
                            New Asset
                        </button>
                    </div>
                </section>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                        Asset Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {JOB_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = data.type === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => onChange('type', type.id)}
                                    className={cn(
                                        "flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <Icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-semibold mb-1">{type.label}</span>
                                    <span className={cn(
                                        "text-xs leading-tight",
                                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground/70"
                                    )}>
                                        {type.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Job Title / Reference
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => onChange('title', e.target.value)}
                            placeholder="e.g. 123 Ocean Drive"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Client Name
                        </label>
                        <input
                            type="text"
                            value={data.clientName}
                            onChange={(e) => onChange('clientName', e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Asset Location
                        </label>
                        <input
                            type="text"
                            value={data.location}
                            onChange={(e) => onChange('location', e.target.value)}
                            placeholder="e.g. Gold Coast, QLD"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        What should the AI look for?
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => onChange('description', e.target.value)}
                        placeholder="Briefly describe the damage to report. E.g. 'Look for cracked tiles, missing shingles, and hail impact marks on the north side.'"
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
