"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Plus,
    Search,
    FileText,
    Trash2,
    MapPin,
    Calendar,
    ArrowUpRight,
    SearchX,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    Building2,
    Brain,
    LogOut
} from 'lucide-react';
import { storage, SurveyRecord } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const [history, setHistory] = useState<SurveyRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const loadHistory = async () => {
            const data = await storage.getHistory(user.id);
            setHistory(data);
            setIsLoading(false);
        };
        loadHistory();
    }, [user]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this survey?')) {
            await storage.deleteSurvey(id);
            if (user) {
                const data = await storage.getHistory(user.id);
                setHistory(data);
            }
        }
    };

    const stats = {
        total: history.length,
        critical: history.reduce((acc, curr) => acc + (curr.analysisResult?.damages?.filter((d: any) => d.severity === 'Critical').length || 0), 0),
        clients: new Set(history.map(item => item.jobData.clientName)).size,
        avgHealth: history.length > 0 ? Math.round(history.reduce((acc, c) => acc + (c.healthScore || 0), 0) / history.length) : 0,
        distribution: history.reduce((acc: Record<string, number>, curr) => {
            curr.analysisResult?.damages?.forEach((d: any) => {
                const type = d.defectType || 'General';
                acc[type] = (acc[type] || 0) + 1;
            });
            return acc;
        }, {})
    };

    // Calculate distribution percentages for top 3 types
    const totalDefects = Object.values(stats.distribution).reduce((a, b) => a + b, 0);
    const topDistribution = Object.entries(stats.distribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([label, count]) => ({
            label,
            value: totalDefects > 0 ? `${Math.round((count / totalDefects) * 100)}%` : '0%',
            color: label.toLowerCase().includes('structural') ? 'bg-orange-500' :
                label.toLowerCase().includes('critical') ? 'bg-red-500' : 'bg-primary'
        }));

    // Group history by assetId
    const groupedAssets = history.reduce((acc: Record<string, { assetId: string, title: string, location: string, client: string, surveys: SurveyRecord[] }>, curr) => {
        const aId = curr.jobData.assetId || 'unknown';
        if (!acc[aId]) {
            acc[aId] = {
                assetId: aId,
                title: curr.jobData.title,
                location: curr.jobData.location,
                client: curr.jobData.clientName,
                surveys: []
            };
        }
        acc[aId].surveys.push(curr);
        return acc;
    }, {});

    const assetList = Object.values(groupedAssets).filter(asset =>
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Nav */}
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="size-5 text-primary-foreground" />
                        </div>
                        <span className="font-black text-lg tracking-tighter uppercase italic">
                            SEQ <span className="text-primary italic">Intelligence</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/training"
                            className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all"
                        >
                            <Brain className="size-4" />
                            Training
                        </Link>
                        <Link
                            href="/survey"
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="size-4" />
                            New Survey
                        </Link>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                        >
                            <LogOut className="size-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Total Surveys', value: stats.total, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Critical Defects', value: stats.critical, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10' },
                        { label: 'Unique Clients', value: stats.clients, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
                    ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{stat.label}</span>
                                <h2 className="text-3xl font-black text-white tracking-tight">{stat.value}</h2>
                            </div>
                            <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("size-6", stat.color)} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Site Health 360 Executive View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    <div className="lg:col-span-2 p-8 rounded-[32px] bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="size-32 text-primary -rotate-12" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
                            <div className="flex-shrink-0">
                                <div className="size-40 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                                    <svg className="absolute inset-0 size-full -rotate-90">
                                        <circle
                                            cx="80" cy="80" r="70"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="10"
                                            className="text-primary/10"
                                        />
                                        <circle
                                            cx="80" cy="80" r="70"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="10"
                                            strokeDasharray={440}
                                            strokeDashoffset={440 - (440 * (history.length > 0 ? (history.reduce((acc, c) => acc + (c.healthScore || 0), 0) / history.length) : 0)) / 100}
                                            className="text-primary transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-white">
                                            {stats.avgHealth}
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">Site Integrity</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Executive Portfolio Summary</div>
                                <h3 className="text-2xl font-bold text-white leading-tight">Your Asset Portfolio is showing
                                    <span className="text-primary"> {stats.avgHealth > 70 ? 'Optimal' : 'Needs Maintenance'} </span>
                                    Conditions.
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                                    Aggregate analysis across {history.length} active surveys indicates a maintenance priority rating of {stats.critical > 5 ? 'High' : 'Moderate'}. Critical defects require attention within the next 30 days.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Priority Distribution</div>
                        <div className="flex-1 flex flex-col justify-center space-y-4">
                            {topDistribution.length > 0 ? topDistribution.map((item, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className="text-white">{item.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", item.color)} style={{ width: item.value }} />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">No anomaly data available</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by client, location or ref..."
                            className="w-full bg-slate-900/60 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Asset-Centric Grid */}
                {assetList.length > 0 ? (
                    <div className="space-y-12">
                        {assetList.map((asset) => (
                            <section key={asset.assetId} className="space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Building2 className="size-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold flex items-center gap-3">
                                                {asset.title}
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                                    {asset.surveys.length} {asset.surveys.length === 1 ? 'Survey' : 'Chronological Inspections'}
                                                </span>
                                                {asset.surveys.length > 1 && (() => {
                                                    const sorted = [...asset.surveys].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                                    const delta = (sorted[0].healthScore || 0) - (sorted[1].healthScore || 0);
                                                    return (
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                                                            delta > 0 ? "text-emerald-400 bg-emerald-400/10" :
                                                                delta < 0 ? "text-red-400 bg-red-400/10" : "text-slate-500 bg-white/5"
                                                        )}>
                                                            {delta > 0 ? 'Improving' : delta < 0 ? 'Declining' : 'Stable'}
                                                            {delta !== 0 && (delta > 0 ? <TrendingUp className="size-3" /> : <ShieldAlert className="size-3" />)}
                                                        </div>
                                                    );
                                                })()}
                                            </h2>
                                            <p className="text-sm text-slate-400">{asset.location} • {asset.client}</p>
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 mx-8 bg-white/5 group-hover:bg-primary/20 transition-all" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {asset.surveys.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((survey) => (
                                        <div
                                            key={survey.id}
                                            className="group bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-primary/30 transition-all"
                                        >
                                            <div className="aspect-[16/10] relative">
                                                {survey.thumbnail ? (
                                                    <img src={survey.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={survey.jobData.title} />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                        <FileText className="size-10 text-slate-700" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <div className={cn(
                                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        survey.status === 'Finalized' ? "bg-primary/20 text-primary border border-primary/30" : "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                                                    )}>
                                                        {survey.status}
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">Observation Date</span>
                                                    <span className="text-xs font-bold text-white">{new Date(survey.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                                            <span>Site Health Index</span>
                                                            <span className="text-primary">{survey.healthScore || 0}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${survey.healthScore || 0}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                        <TrendingUp className="size-4 text-primary" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={(e) => handleDelete(survey.id, e)}
                                                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                    <Link
                                                        href={`/survey?id=${survey.id}`}
                                                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-center py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Review Timeline
                                                        <ArrowUpRight className="size-3 opacity-50" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="size-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                            <SearchX className="size-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No inspections found</h3>
                        <p className="text-slate-400 text-sm max-w-xs mb-8">
                            {searchQuery ? "No results match your search criteria. Try a different query." : "You haven't conducted any drone surveys yet. Start your first inspection now."}
                        </p>
                        {!searchQuery && (
                            <Link
                                href="/survey"
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
                            >
                                Start First Survey
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
