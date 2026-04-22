'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
    Bug,
    Plus,
    Search,
    X,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    ArrowRight,
    Filter,
    LayoutDashboard,
    LogOut,
    Sparkles,
    Lightbulb,
    Wrench,
    MessageSquare,
    Trash2,
    GripVertical,
    Calendar,
    Tag,
    CircleDot,
    ArrowUpCircle,
    ArrowDownCircle,
    MinusCircle,
    AlertTriangle,
    Brain,
    XCircle,
    ImagePlus,
    Image as ImageIcon,
    Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { issueStorage, Issue } from '@/lib/storage';

type StatusFilter = 'all' | Issue['status'];
type PriorityFilter = 'all' | Issue['priority'];
type CategoryFilter = 'all' | Issue['category'];

const STATUS_CONFIG = {
    open: { label: 'Open', icon: CircleDot, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    in_progress: { label: 'In Progress', icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    closed: { label: 'Closed', icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-500' },
};

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    high: { label: 'High', icon: ArrowUpCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    medium: { label: 'Medium', icon: MinusCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    low: { label: 'Low', icon: ArrowDownCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const CATEGORY_CONFIG = {
    bug: { label: 'Bug', icon: Bug, color: 'text-red-400' },
    feature: { label: 'Feature', icon: Lightbulb, color: 'text-purple-400' },
    improvement: { label: 'Improvement', icon: Sparkles, color: 'text-cyan-400' },
    task: { label: 'Task', icon: Wrench, color: 'text-slate-400' },
};

const NEXT_STATUS: Record<Issue['status'], Issue['status']> = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
    closed: 'open',
};

export default function IssuesPage() {
    const { user, signOut } = useAuth();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [showNewForm, setShowNewForm] = useState(false);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
    const [editingIssue, setEditingIssue] = useState<string | null>(null);

    // New issue form state
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPriority, setNewPriority] = useState<Issue['priority']>('medium');
    const [newCategory, setNewCategory] = useState<Issue['category']>('bug');
    const [newModule, setNewModule] = useState('');
    const [newScreenshot, setNewScreenshot] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        loadIssues();
    }, [user]);

    useEffect(() => {
        if (showNewForm && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [showNewForm]);

    const loadIssues = async () => {
        if (!user) return;
        setIsLoading(true);
        const data = await issueStorage.getAll(user.id);
        setIssues(data);
        setIsLoading(false);
    };

    const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewScreenshot(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCreateIssue = async () => {
        if (!user || !newTitle.trim()) return;
        await issueStorage.create({
            title: newTitle.trim(),
            description: newDescription.trim(),
            priority: newPriority,
            category: newCategory,
            status: 'open',
            module: newModule.trim() || undefined,
            screenshot: newScreenshot || undefined,
        }, user.id);
        setNewTitle('');
        setNewDescription('');
        setNewPriority('medium');
        setNewCategory('bug');
        setNewModule('');
        setNewScreenshot(null);
        setShowNewForm(false);
        loadIssues();
    };

    const handleStatusChange = async (issueId: string, newStatus: Issue['status']) => {
        await issueStorage.updateStatus(issueId, newStatus);
        loadIssues();
    };

    const handleDelete = async (issueId: string) => {
        if (confirm('Delete this issue permanently?')) {
            await issueStorage.remove(issueId);
            loadIssues();
        }
    };

    // Filtering
    const filtered = issues.filter(issue => {
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                issue.title.toLowerCase().includes(q) ||
                issue.description?.toLowerCase().includes(q) ||
                issue.module?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Stats
    const openCount = issues.filter(i => i.status === 'open').length;
    const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const criticalCount = issues.filter(i => i.priority === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* ──── Nav Bar ──── */}
            <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <LayoutDashboard className="size-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Bug className="size-5 text-primary" />
                            <span className="text-sm font-bold">Issue Tracker</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/training" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <Brain className="size-4" />
                            <span className="text-xs font-medium hidden md:inline">Training</span>
                        </Link>
                        <button onClick={signOut} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <LogOut className="size-4" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* ──── Header ──── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Project Management</div>
                        <h1 className="text-3xl font-bold tracking-tight">Bugs & Issues</h1>
                        <p className="text-sm text-muted-foreground mt-1">Track, prioritise, and resolve platform issues.</p>
                    </div>
                    <button
                        onClick={() => setShowNewForm(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Plus className="size-4" />
                        New Issue
                    </button>
                </div>

                {/* ──── Stats Strip ──── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: 'Open', value: openCount, icon: CircleDot, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Critical', value: criticalCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-colors"
                        >
                            <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("size-5", stat.color)} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ──── New Issue Form ──── */}
                {showNewForm && (
                    <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Plus className="size-4 text-primary" />
                                Create New Issue
                            </h3>
                            <button onClick={() => setShowNewForm(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input
                                ref={titleInputRef}
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Issue title..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) handleCreateIssue(); }}
                            />

                            <textarea
                                value={newDescription}
                                onChange={e => setNewDescription(e.target.value)}
                                placeholder="Describe the issue in detail... (optional)"
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                            />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Priority */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Object.keys(PRIORITY_CONFIG) as Issue['priority'][]).map(p => {
                                            const cfg = PRIORITY_CONFIG[p];
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setNewPriority(p)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                                        newPriority === p ? `${cfg.bg} ${cfg.color} ${cfg.border} border` : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Object.keys(CATEGORY_CONFIG) as Issue['category'][]).map(c => {
                                            const cfg = CATEGORY_CONFIG[c];
                                            return (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewCategory(c)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                                                        newCategory === c ? `bg-white/10 ${cfg.color} border border-white/10` : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <cfg.icon className="size-3" />
                                                    {cfg.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Module */}
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Module (optional)</label>
                                    <input
                                        value={newModule}
                                        onChange={e => setNewModule(e.target.value)}
                                        placeholder="e.g. Survey, Dashboard, PDF Reports..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </div>
                            </div>

                            {/* Screenshot Upload */}
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Screenshot (optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotUpload}
                                    className="hidden"
                                />
                                {newScreenshot ? (
                                    <div className="relative group inline-block">
                                        <img
                                            src={newScreenshot}
                                            alt="Screenshot preview"
                                            className="h-32 rounded-xl border border-white/10 object-cover"
                                        />
                                        <button
                                            onClick={() => setNewScreenshot(null)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-dashed border-white/10 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-white/[0.06] transition-all"
                                    >
                                        <ImagePlus className="size-4" />
                                        Attach screenshot or image
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowNewForm(false)}
                                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateIssue}
                                    disabled={!newTitle.trim()}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-30 hover:opacity-90 transition-all active:scale-95"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Create Issue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── Filters ──── */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search issues..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer min-w-[120px]"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value as PriorityFilter)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer min-w-[120px]"
                        >
                            <option value="all">All Priority</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer min-w-[120px]"
                        >
                            <option value="all">All Types</option>
                            <option value="bug">Bug</option>
                            <option value="feature">Feature</option>
                            <option value="improvement">Improvement</option>
                            <option value="task">Task</option>
                        </select>
                    </div>
                </div>

                {/* ──── Issue Count ──── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'issue' : 'issues'}
                        {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                            <span> (filtered from {issues.length} total)</span>
                        )}
                    </div>
                </div>

                {/* ──── Issues List ──── */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Loader2 className="size-8 text-primary animate-spin mb-4" />
                        <p className="text-sm text-muted-foreground">Loading issues...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-4 rounded-full bg-white/5 mb-4">
                            {issues.length === 0 ? <Bug className="size-8 text-muted-foreground/30" /> : <Search className="size-8 text-muted-foreground/30" />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-400 mb-1">
                            {issues.length === 0 ? 'No issues yet' : 'No matching issues'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {issues.length === 0
                                ? 'Click "New Issue" to start tracking bugs and feature requests.'
                                : 'Try adjusting your filters or search query.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((issue) => {
                            const statusCfg = STATUS_CONFIG[issue.status];
                            const priorityCfg = PRIORITY_CONFIG[issue.priority];
                            const categoryCfg = CATEGORY_CONFIG[issue.category];
                            const StatusIcon = statusCfg.icon;
                            const PriorityIcon = priorityCfg.icon;
                            const CategoryIcon = categoryCfg.icon;
                            const isExpanded = expandedIssue === issue.id;

                            return (
                                <div
                                    key={issue.id}
                                    className={cn(
                                        "group bg-white/[0.02] border border-white/5 rounded-xl transition-all hover:bg-white/[0.04] hover:border-white/10",
                                        isExpanded && "bg-white/[0.04] border-white/10"
                                    )}
                                >
                                    {/* Main Row */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                                        onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                                    >
                                        {/* Status Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(issue.id, NEXT_STATUS[issue.status]);
                                            }}
                                            className={cn(
                                                "p-1 rounded-lg transition-all hover:scale-110",
                                                statusCfg.bg
                                            )}
                                            title={`Move to ${STATUS_CONFIG[NEXT_STATUS[issue.status]].label}`}
                                        >
                                            <StatusIcon className={cn("size-4", statusCfg.color, issue.status === 'in_progress' && 'animate-spin')} />
                                        </button>

                                        {/* Priority */}
                                        <PriorityIcon className={cn("size-4 flex-shrink-0", priorityCfg.color)} />

                                        {/* Title */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-sm font-semibold truncate",
                                                    (issue.status === 'closed' || issue.status === 'resolved') && "line-through opacity-50"
                                                )}>
                                                    {issue.title}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="hidden md:flex items-center gap-2">
                                            {/* Category badge */}
                                            <span className={cn(
                                                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5",
                                                categoryCfg.color
                                            )}>
                                                <CategoryIcon className="size-3" />
                                                {categoryCfg.label}
                                            </span>

                                            {/* Module badge */}
                                            {issue.module && (
                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5 text-muted-foreground">
                                                    {issue.module}
                                                </span>
                                            )}

                                            {/* Status badge */}
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                                                statusCfg.bg, statusCfg.color
                                            )}>
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <span className="text-[10px] text-muted-foreground/60 hidden lg:block min-w-[70px] text-right">
                                            {new Date(issue.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                        </span>

                                        {/* Expand Arrow */}
                                        <ChevronRight className={cn(
                                            "size-4 text-muted-foreground/30 transition-transform",
                                            isExpanded && "rotate-90"
                                        )} />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-0 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="pt-4 space-y-4">
                                                {/* Mobile badges */}
                                                <div className="flex md:hidden items-center gap-2 flex-wrap">
                                                    <span className={cn(
                                                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5",
                                                        categoryCfg.color
                                                    )}>
                                                        <CategoryIcon className="size-3" />
                                                        {categoryCfg.label}
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                                                        statusCfg.bg, statusCfg.color
                                                    )}>
                                                        {statusCfg.label}
                                                    </span>
                                                    {issue.module && (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5 text-muted-foreground">
                                                            {issue.module}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                {issue.description ? (
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {issue.description}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground/40 italic">No description provided.</p>
                                                )}

                                                {/* Screenshot */}
                                                {issue.screenshot && (
                                                    <div className="relative group">
                                                        <img
                                                            src={issue.screenshot}
                                                            alt="Issue screenshot"
                                                            className="max-h-64 rounded-xl border border-white/10 object-contain bg-black/30 cursor-pointer hover:border-primary/30 transition-all"
                                                            onClick={() => setLightboxImage(issue.screenshot!)}
                                                        />
                                                        <button
                                                            onClick={() => setLightboxImage(issue.screenshot!)}
                                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                                        >
                                                            <Maximize2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Meta Row */}
                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        Created {new Date(issue.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    {issue.updated_at !== issue.created_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="size-3" />
                                                            Updated {new Date(issue.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                    {/* Status Transitions */}
                                                    {(Object.keys(STATUS_CONFIG) as Issue['status'][]).map(s => {
                                                        if (s === issue.status) return null;
                                                        const cfg = STATUS_CONFIG[s];
                                                        return (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(issue.id, s)}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-[1.02]",
                                                                    cfg.bg, cfg.color, "border", cfg.border
                                                                )}
                                                            >
                                                                <cfg.icon className="size-3" />
                                                                {cfg.label}
                                                            </button>
                                                        );
                                                    })}

                                                    <div className="flex-1" />

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(issue.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <Trash2 className="size-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ──── Lightbox ──── */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        onClick={() => setLightboxImage(null)}
                    >
                        <X className="size-5" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Screenshot full view"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
