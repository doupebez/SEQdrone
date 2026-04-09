'use client';

import { useState, useCallback } from 'react';
import {
    Plus,
    Copy,
    Trash2,
    ChevronDown,
    ChevronUp,
    CopyPlus,
    Shield,
    MapPin,
    User,
    Building2,
    Calendar,
    Award,
    AlertTriangle,
    Camera,
    CheckCircle2,
    XCircle,
    MinusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeightSafetyEquipment, HeightSafetyDefect, HeightSafetyInspection } from '@/lib/storage';

// ── Constants ──

const EQUIPMENT_TYPES = [
    'M16 Eyelet',
    'Surface Mount FA',
    'Surface Mount RA',
    'Davit Base',
    'Static Line',
    'Davit Arm',
    'Concrete Mount',
    'Concrete Mount SL',
    'Chemically Set Anchor',
    'Mechanical / Expansion Anchor',
];

const FIXING_METHODS = ['Chemical', 'Cast In', 'Rivet / Screw', 'N/A'];

const TEST_METHODS = ['Visual', 'Proof Load', 'Pull Test'];

const RISK_RATINGS: HeightSafetyDefect['riskRating'][] = ['Low', 'Medium', 'High', 'Extreme'];

const RESULT_OPTIONS: HeightSafetyEquipment['result'][] = ['Pass', 'Fail', 'No Access'];

// ── Props ──

interface HeightSafetyFormProps {
    data: HeightSafetyInspection;
    onChange: (data: HeightSafetyInspection) => void;
}

// ── Subcomponents ──

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
            />
        </div>
    );
}

function SelectField({ value, onChange, options, className }: {
    value: string; onChange: (v: string) => void; options: string[]; className?: string;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                "bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer",
                className
            )}
        >
            {options.map(o => <option key={o} value={o} className="bg-[#0a0f1d]">{o}</option>)}
        </select>
    );
}

// ── Main Component ──

export function HeightSafetyForm({ data, onChange }: HeightSafetyFormProps) {
    const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
    const [bulkCount, setBulkCount] = useState<Record<number, number>>({});
    const [newLocation, setNewLocation] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'equipment' | 'defects'>('details');

    // ── Update Helpers ──
    const updateField = useCallback(<K extends keyof HeightSafetyInspection>(key: K, value: HeightSafetyInspection[K]) => {
        onChange({ ...data, [key]: value });
    }, [data, onChange]);

    const updateEquipment = useCallback((index: number, field: keyof HeightSafetyEquipment, value: any) => {
        const updated = [...data.equipment];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...data, equipment: updated });
    }, [data, onChange]);

    const addEquipmentRow = useCallback((location: string = 'Roof') => {
        const existingInLocation = data.equipment.filter(e => e.location === location);
        const nextNum = existingInLocation.length + 1;
        const prefix = location.charAt(0).toUpperCase();
        const newRow: HeightSafetyEquipment = {
            id: `${prefix} ${nextNum}`,
            location,
            equipmentType: EQUIPMENT_TYPES[0],
            fixingMethod: FIXING_METHODS[0],
            ratingKN: '15',
            testMethod: TEST_METHODS[0],
            ropeAccess: false,
            fallArrest: false,
            result: 'Pass',
        };
        onChange({ ...data, equipment: [...data.equipment, newRow] });
    }, [data, onChange]);

    const duplicateRow = useCallback((index: number) => {
        const source = data.equipment[index];
        const sameLocation = data.equipment.filter(e => e.location === source.location);
        // Parse the highest ID number in this location
        const nums = sameLocation.map(e => {
            const match = e.id.match(/(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        });
        const nextNum = Math.max(...nums, 0) + 1;
        const prefix = source.id.replace(/\d+$/, '');
        const newRow: HeightSafetyEquipment = {
            ...source,
            id: `${prefix}${nextNum}`,
        };
        const newEquipment = [...data.equipment];
        newEquipment.splice(index + 1, 0, newRow);
        onChange({ ...data, equipment: newEquipment });
    }, [data, onChange]);

    const bulkDuplicate = useCallback((index: number, count: number) => {
        const source = data.equipment[index];
        const sameLocation = data.equipment.filter(e => e.location === source.location);
        const nums = sameLocation.map(e => {
            const match = e.id.match(/(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        });
        let nextNum = Math.max(...nums, 0) + 1;
        const prefix = source.id.replace(/\d+$/, '');
        const newRows: HeightSafetyEquipment[] = [];
        for (let i = 0; i < count; i++) {
            newRows.push({ ...source, id: `${prefix}${nextNum + i}` });
        }
        const newEquipment = [...data.equipment];
        newEquipment.splice(index + 1, 0, ...newRows);
        onChange({ ...data, equipment: newEquipment });
        setBulkCount(prev => ({ ...prev, [index]: 0 }));
    }, [data, onChange]);

    const removeEquipment = useCallback((index: number) => {
        onChange({ ...data, equipment: data.equipment.filter((_, i) => i !== index) });
    }, [data, onChange]);

    // ── Defect Helpers ──
    const addDefect = useCallback(() => {
        const newDefect: HeightSafetyDefect = {
            id: `defect-${Date.now()}`,
            equipmentIds: '',
            location: '',
            riskRating: 'High',
            description: '',
            safeForTempUse: false,
            resolution: '',
        };
        onChange({ ...data, defects: [...data.defects, newDefect] });
    }, [data, onChange]);

    const updateDefect = useCallback((index: number, field: keyof HeightSafetyDefect, value: any) => {
        const updated = [...data.defects];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...data, defects: updated });
    }, [data, onChange]);

    const removeDefect = useCallback((index: number) => {
        onChange({ ...data, defects: data.defects.filter((_, i) => i !== index) });
    }, [data, onChange]);

    const handleDefectPhoto = useCallback((index: number, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            updateDefect(index, 'photo', e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, [updateDefect]);

    // ── Location grouping ──
    const locations = [...new Set(data.equipment.map(e => e.location))];
    const equipmentByLocation = locations.reduce((acc, loc) => {
        acc[loc] = data.equipment
            .map((eq, originalIndex) => ({ ...eq, _originalIndex: originalIndex }))
            .filter(e => e.location === loc);
        return acc;
    }, {} as Record<string, (HeightSafetyEquipment & { _originalIndex: number })[]>);

    // Summary stats
    const totalEquipment = data.equipment.length;
    const passCount = data.equipment.filter(e => e.result === 'Pass').length;
    const failCount = data.equipment.filter(e => e.result === 'Fail').length;
    const noAccessCount = data.equipment.filter(e => e.result === 'No Access').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Tab Navigation */}
            <div className="flex bg-[#0a0f1d] p-1.5 rounded-full border border-white/5 shadow-inner max-w-xl mx-auto">
                {[
                    { id: 'details' as const, label: 'Inspector & Site', icon: User },
                    { id: 'equipment' as const, label: 'Equipment Register', icon: Shield },
                    { id: 'defects' as const, label: 'Defects', icon: AlertTriangle },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-xl"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="size-3.5" />
                        {tab.label}
                        {tab.id === 'equipment' && totalEquipment > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[8px]">{totalEquipment}</span>
                        )}
                        {tab.id === 'defects' && data.defects.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-500/30 text-red-300 rounded-full text-[8px]">{data.defects.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab: Inspector & Site Details */}
            {activeTab === 'details' && (
                <div className="space-y-8 max-w-2xl mx-auto">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                            <User className="size-3" />
                            Inspector Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Inspector Name" value={data.inspectorName} onChange={v => updateField('inspectorName', v)} placeholder="e.g. John Smith" />
                            <InputField label="Licence / Cert No." value={data.inspectorCert} onChange={v => updateField('inspectorCert', v)} placeholder="e.g. HSI-12345" />
                            <InputField label="Company" value={data.inspectorCompany} onChange={v => updateField('inspectorCompany', v)} placeholder="e.g. Allied Commercial" />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                            <Building2 className="size-3" />
                            Site Details
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
                            <span className="text-slate-500 font-bold">Note:</span> Building name and address are set from the Job Details step.
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Building Description</label>
                            <textarea
                                value={data.buildingDescription}
                                onChange={(e) => updateField('buildingDescription', e.target.value)}
                                placeholder="Brief description of the building and roof type..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                            <Calendar className="size-3" />
                            Inspection Dates
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Inspection Date" type="date" value={data.inspectionDate} onChange={v => updateField('inspectionDate', v)} />
                            <InputField label="Next Due Date" type="date" value={data.nextDueDate} onChange={v => updateField('nextDueDate', v)} />
                        </div>
                    </section>
                </div>
            )}

            {/* Tab: Equipment Register */}
            {activeTab === 'equipment' && (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    {totalEquipment > 0 && (
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Total', value: totalEquipment, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                { label: 'Pass', value: passCount, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { label: 'Fail', value: failCount, color: 'text-red-400', bg: 'bg-red-400/10' },
                                { label: 'No Access', value: noAccessCount, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                            ].map((stat, i) => (
                                <div key={i} className={cn("p-4 rounded-2xl border border-white/5 text-center", stat.bg)}>
                                    <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Location */}
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="New location (e.g. Level 25, Roof, Carpark P1)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button
                            onClick={() => {
                                if (newLocation.trim()) {
                                    addEquipmentRow(newLocation.trim());
                                    setExpandedLocations(prev => ({ ...prev, [newLocation.trim()]: true }));
                                    setNewLocation('');
                                }
                            }}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                        >
                            <MapPin className="size-3.5" />
                            Add Location
                        </button>
                    </div>

                    {/* Equipment by Location */}
                    {locations.length === 0 ? (
                        <div className="py-16 text-center space-y-4">
                            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                <Shield className="size-8 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">No Equipment Added</h3>
                                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                                    Add a location above to start logging height safety equipment.
                                </p>
                            </div>
                        </div>
                    ) : (
                        locations.map(location => {
                            const items = equipmentByLocation[location];
                            const isExpanded = expandedLocations[location] !== false; // default expanded
                            return (
                                <div key={location} className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                                    {/* Location Header */}
                                    <button
                                        onClick={() => setExpandedLocations(prev => ({ ...prev, [location]: !isExpanded }))}
                                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin className="size-4 text-primary" />
                                            <span className="font-bold text-white">{location}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-slate-400">
                                                {items.length} items
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-2">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[60px_1fr_1fr_80px_1fr_60px_60px_90px_90px] gap-2 px-2 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                <span>ID</span>
                                                <span>Equipment Type</span>
                                                <span>Fixing Method</span>
                                                <span>kN</span>
                                                <span>Test Method</span>
                                                <span>RA</span>
                                                <span>FA</span>
                                                <span>Result</span>
                                                <span>Actions</span>
                                            </div>

                                            {/* Equipment Rows */}
                                            {items.map((item) => (
                                                <div
                                                    key={item._originalIndex}
                                                    className={cn(
                                                        "grid grid-cols-[60px_1fr_1fr_80px_1fr_60px_60px_90px_90px] gap-2 px-2 py-1.5 rounded-xl items-center transition-all",
                                                        item.result === 'Fail' ? "bg-red-500/5 border border-red-500/10" :
                                                        item.result === 'No Access' ? "bg-amber-500/5 border border-amber-500/10" :
                                                        "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                                                    )}
                                                >
                                                    <input
                                                        value={item.id}
                                                        onChange={(e) => updateEquipment(item._originalIndex, 'id', e.target.value)}
                                                        className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 w-full"
                                                    />
                                                    <SelectField
                                                        value={item.equipmentType}
                                                        onChange={(v) => updateEquipment(item._originalIndex, 'equipmentType', v)}
                                                        options={EQUIPMENT_TYPES}
                                                    />
                                                    <SelectField
                                                        value={item.fixingMethod}
                                                        onChange={(v) => updateEquipment(item._originalIndex, 'fixingMethod', v)}
                                                        options={FIXING_METHODS}
                                                    />
                                                    <input
                                                        value={item.ratingKN}
                                                        onChange={(e) => updateEquipment(item._originalIndex, 'ratingKN', e.target.value)}
                                                        className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 w-full"
                                                    />
                                                    <SelectField
                                                        value={item.testMethod}
                                                        onChange={(v) => updateEquipment(item._originalIndex, 'testMethod', v)}
                                                        options={TEST_METHODS}
                                                    />
                                                    <button
                                                        onClick={() => updateEquipment(item._originalIndex, 'ropeAccess', !item.ropeAccess)}
                                                        className={cn(
                                                            "size-7 rounded-lg flex items-center justify-center border transition-all mx-auto",
                                                            item.ropeAccess ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-slate-600"
                                                        )}
                                                    >
                                                        {item.ropeAccess && <CheckCircle2 className="size-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => updateEquipment(item._originalIndex, 'fallArrest', !item.fallArrest)}
                                                        className={cn(
                                                            "size-7 rounded-lg flex items-center justify-center border transition-all mx-auto",
                                                            item.fallArrest ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-slate-600"
                                                        )}
                                                    >
                                                        {item.fallArrest && <CheckCircle2 className="size-3.5" />}
                                                    </button>
                                                    <SelectField
                                                        value={item.result}
                                                        onChange={(v) => updateEquipment(item._originalIndex, 'result', v as HeightSafetyEquipment['result'])}
                                                        options={RESULT_OPTIONS}
                                                        className={cn(
                                                            item.result === 'Pass' ? "!text-emerald-400 !border-emerald-500/20" :
                                                            item.result === 'Fail' ? "!text-red-400 !border-red-500/20 font-bold" :
                                                            "!text-amber-400 !border-amber-500/20"
                                                        )}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => duplicateRow(item._originalIndex)}
                                                            title="Duplicate row"
                                                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                        >
                                                            <Copy className="size-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeEquipment(item._originalIndex)}
                                                            title="Remove row"
                                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Row & Bulk Actions */}
                                            <div className="flex items-center gap-3 pt-2">
                                                <button
                                                    onClick={() => addEquipmentRow(location)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-primary/40 transition-all text-xs font-bold"
                                                >
                                                    <Plus className="size-3" />
                                                    Add Row
                                                </button>
                                                {items.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 font-bold">Bulk duplicate last row ×</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="500"
                                                            value={bulkCount[items[items.length - 1]._originalIndex] || ''}
                                                            onChange={e => setBulkCount(prev => ({ ...prev, [items[items.length - 1]._originalIndex]: parseInt(e.target.value) || 0 }))}
                                                            placeholder="10"
                                                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const idx = items[items.length - 1]._originalIndex;
                                                                const count = bulkCount[idx] || 0;
                                                                if (count > 0) bulkDuplicate(idx, count);
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            <CopyPlus className="size-3" />
                                                            Bulk Add
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Tab: Defects */}
            {activeTab === 'defects' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                            <AlertTriangle className="size-3" />
                            Failed Items & Defects
                        </div>
                        <button
                            onClick={addDefect}
                            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                        >
                            <Plus className="size-3.5" />
                            Add Defect
                        </button>
                    </div>

                    {data.defects.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <CheckCircle2 className="size-12 text-emerald-500/30 mx-auto" />
                            <p className="text-sm text-slate-400">No defects recorded. All items compliant.</p>
                        </div>
                    ) : (
                        data.defects.map((defect, i) => (
                            <div key={defect.id} className="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Defect #{i + 1}</span>
                                    <button
                                        onClick={() => removeDefect(i)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField label="Equipment ID(s)" value={defect.equipmentIds} onChange={v => updateDefect(i, 'equipmentIds', v)} placeholder="e.g. A8 – A11" />
                                    <InputField label="Location" value={defect.location} onChange={v => updateDefect(i, 'location', v)} placeholder="e.g. Roof" />
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Risk Rating</label>
                                        <div className="flex gap-2">
                                            {RISK_RATINGS.map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => updateDefect(i, 'riskRating', rating)}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                                                        defect.riskRating === rating
                                                            ? rating === 'Extreme' ? "bg-red-500/20 border-red-500/40 text-red-400"
                                                            : rating === 'High' ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                                                            : rating === 'Medium' ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                                                            : "bg-blue-500/20 border-blue-500/40 text-blue-400"
                                                            : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                                    )}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Defect Description</label>
                                    <textarea
                                        value={defect.description}
                                        onChange={(e) => updateDefect(i, 'description', e.target.value)}
                                        placeholder="Describe the defect, non-compliance, or safety issue..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Safe for Temporary Use?</label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => updateDefect(i, 'safeForTempUse', true)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                                    defect.safeForTempUse
                                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                                )}
                                            >
                                                <CheckCircle2 className="size-3.5" /> Yes
                                            </button>
                                            <button
                                                onClick={() => updateDefect(i, 'safeForTempUse', false)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                                    !defect.safeForTempUse
                                                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                                                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                                )}
                                            >
                                                <XCircle className="size-3.5" /> No
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Defect Photo</label>
                                        {defect.photo ? (
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 h-20">
                                                <img src={defect.photo} alt="Defect" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => updateDefect(i, 'photo', undefined)}
                                                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <XCircle className="size-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-white/20 text-slate-500 hover:text-white hover:border-primary/40 transition-all cursor-pointer text-xs font-bold">
                                                <Camera className="size-3.5" />
                                                Upload Photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleDefectPhoto(i, file);
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Resolution / Recommendation</label>
                                    <textarea
                                        value={defect.resolution}
                                        onChange={(e) => updateDefect(i, 'resolution', e.target.value)}
                                        placeholder="Recommended corrective action..."
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Conclusion */}
            <div className="max-w-3xl mx-auto space-y-3 pt-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Conclusion & Recommendations
                </label>
                <textarea
                    value={data.conclusion}
                    onChange={(e) => updateField('conclusion', e.target.value)}
                    placeholder="Summary of inspection findings and recommendations..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                />
            </div>
        </div>
    );
}
