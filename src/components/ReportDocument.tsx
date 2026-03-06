'use client';

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Svg, Polygon as SvgPolygon, Circle, Line, Font } from '@react-pdf/renderer';
import { calculatePriorityScore } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReportDocumentProps {
    jobData: {
        id: string;
        assetId: string;
        title: string;
        clientName: string;
        location: string;
        description: string;
        type: string;
    };
    analysisResult: {
        summary: string;
        damages: any[];
        assetHealthScore: number;
        assetPolygon?: number[][];
        areaDescriptions?: string[];
    };
    images: string[];
    imageDates?: string[];
    imageCoords?: { lat: number, lng: number }[];
    imageScales?: (number | null)[];
}

// ── Color System ───────────────────────────────────────────────────────────────

const COLORS = {
    brand: '#54BC2F',
    brandDark: '#3a8520',
    brandLight: '#e8f7e0',
    dark: '#0c1220',
    darkSurface: '#111827',
    darkCard: '#1a2236',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#1e293b',
    borderLight: '#334155',
    critical: '#ef4444',
    criticalBg: '#fef2f2',
    criticalLight: '#fee2e2',
    high: '#f97316',
    highBg: '#fff7ed',
    highLight: '#ffedd5',
    medium: '#eab308',
    mediumBg: '#fefce8',
    mediumLight: '#fef9c3',
    low: '#22c55e',
    lowBg: '#f0fdf4',
    lowLight: '#dcfce7',
    white: '#ffffff',
    pageBackground: '#f8fafc',
    cardBackground: '#ffffff',
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'Critical': return COLORS.critical;
        case 'High': return COLORS.high;
        case 'Medium': return COLORS.medium;
        case 'Low': return COLORS.low;
        default: return COLORS.textMuted;
    }
};

const getSeverityBg = (severity: string) => {
    switch (severity) {
        case 'Critical': return COLORS.criticalBg;
        case 'High': return COLORS.highBg;
        case 'Medium': return COLORS.mediumBg;
        case 'Low': return COLORS.lowBg;
        default: return '#f1f5f9';
    }
};

const getConditionColor = (condition: string) => {
    switch (condition) {
        case 'Critical': return COLORS.critical;
        case 'Poor': return COLORS.high;
        case 'Fair': return COLORS.medium;
        case 'Good': return COLORS.low;
        case 'Excellent': return COLORS.brand;
        default: return COLORS.textMuted;
    }
};

const getHealthColor = (score: number) => {
    if (score >= 80) return COLORS.brand;
    if (score >= 60) return COLORS.medium;
    if (score >= 40) return COLORS.high;
    return COLORS.critical;
};

const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Good Condition';
    if (score >= 60) return 'Fair Condition';
    if (score >= 40) return 'Poor Condition';
    return 'Critical Condition';
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // === Page ===
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1e293b',
        backgroundColor: COLORS.pageBackground,
        position: 'relative',
        paddingTop: 65,
        paddingBottom: 65,
    },

    // === Cover Page ===
    coverPage: {
        fontFamily: 'Helvetica',
        backgroundColor: COLORS.dark,
        color: COLORS.textPrimary,
        position: 'relative',
    },
    coverAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: COLORS.brand,
    },
    coverContent: {
        padding: '80 50 50 50',
        flex: 1,
        justifyContent: 'space-between',
    },
    coverTopSection: {
        marginBottom: 30,
    },
    coverCompanyName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.brand,
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    coverCompanyTagline: {
        fontSize: 8,
        color: COLORS.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    coverDivider: {
        width: 60,
        height: 2,
        backgroundColor: COLORS.brand,
        marginTop: 24,
        marginBottom: 24,
    },
    coverTitle: {
        fontSize: 32,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textPrimary,
        lineHeight: 1.2,
        marginBottom: 8,
    },
    coverSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 1.5,
        marginBottom: 30,
    },
    coverHealthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 40,
    },
    coverHealthScore: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverHealthValue: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textPrimary,
    },
    coverHealthLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    coverMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 0,
    },
    coverMetaItem: {
        width: '50%',
        paddingVertical: 10,
        paddingRight: 20,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    coverMetaLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    coverMetaValue: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textPrimary,
    },
    coverFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        paddingTop: 16,
    },
    coverFooterText: {
        fontSize: 7,
        color: COLORS.textMuted,
    },
    coverConfidential: {
        fontSize: 7,
        color: COLORS.critical,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // === Header (all other pages) ===
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 24,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerBrandDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.brand,
    },
    headerCompany: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    headerAsset: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
    },
    headerRef: {
        fontSize: 7,
        color: COLORS.textMuted,
    },

    // === Footer ===
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 7,
        color: COLORS.textMuted,
    },
    footerPageNumber: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
    },
    footerAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: COLORS.brand,
    },

    // === Content ===
    content: {
        paddingHorizontal: 40,
        paddingTop: 16,
        paddingBottom: 0,
    },

    // === Section Headers ===
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        marginTop: 4,
    },
    sectionAccent: {
        width: 3,
        height: 18,
        backgroundColor: COLORS.brand,
        borderRadius: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    sectionSubtitle: {
        fontSize: 8,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },

    // === Executive Summary ===
    summaryBox: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.6,
    },

    // === Dashboard Cards ===
    dashboardRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    dashboardCard: {
        flex: 1,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    dashboardValue: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    dashboardLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // === Severity Bar Chart ===
    severityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    severityLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        width: 50,
        textAlign: 'right',
    },
    severityBarContainer: {
        flex: 1,
        height: 14,
        backgroundColor: '#f1f5f9',
        borderRadius: 7,
        overflow: 'hidden',
    },
    severityBar: {
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        paddingLeft: 6,
    },
    severityBarText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.white,
    },
    severityCount: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        width: 20,
    },

    // === Image Gallery ===
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    galleryItem: {
        width: '48%',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: COLORS.cardBackground,
    },
    galleryImage: {
        width: '100%',
        height: 140,
        objectFit: 'cover',
    },
    galleryCaption: {
        padding: '6 8',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    galleryCaptionText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
    },
    galleryCaptionFindings: {
        fontSize: 7,
        color: COLORS.textMuted,
    },

    // === Finding Page ===
    findingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    findingNumber: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.brand,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    findingTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    findingLocation: {
        fontSize: 8,
        color: COLORS.textMuted,
    },
    findingSeverityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    findingSeverityText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.white,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Finding image section
    findingImageContainer: {
        position: 'relative',
        marginBottom: 12,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 386,
    },
    findingImage: {
        width: '100%',
        height: '100%',
        objectFit: 'fill',
    },
    findingImageLabel: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    findingImageLabelText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.white,
        letterSpacing: 0.5,
    },

    // Finding detail grid
    findingDetailGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    findingDetailCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    findingDetailLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    findingDetailValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },

    // Finding description
    findingDescription: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 6,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    findingDescLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    findingDescText: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.6,
    },

    // Recommendation box
    recommendationBox: {
        borderRadius: 6,
        padding: 14,
        borderWidth: 1,
        borderLeftWidth: 3,
        marginBottom: 10,
    },
    recommendationLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    recommendationText: {
        fontSize: 9,
        lineHeight: 1.6,
    },

    // Zoomed view  
    zoomedContainer: {
        marginBottom: 12,
    },
    zoomedLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    zoomedImageWrapper: {
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 2,
    },
    zoomedImage: {
        width: '100%',
        height: 180,
        objectFit: 'cover',
    },

    // Priority & Measurements
    findingMetaRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    priorityCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    priorityScore: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    priorityLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Table
    table: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableHeaderCell: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        padding: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableCell: {
        fontSize: 8,
        color: '#334155',
        padding: 8,
    },
    tableCellBold: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        padding: 8,
    },
});

// ── Helper Components ──────────────────────────────────────────────────────────

const PageHeader = ({ title, jobId }: { title: string; jobId: string }) => (
    <View style={styles.header} fixed>
        <View style={styles.headerLeft}>
            <View style={styles.headerBrandDot} />
            <Text style={styles.headerCompany}>SEQ Drone Inspections</Text>
        </View>
        <View style={styles.headerRight}>
            <Text style={styles.headerAsset}>{title}</Text>
            <Text style={styles.headerRef}>Ref: {jobId}</Text>
        </View>
    </View>
);

const PageFooter = ({ date }: { date: string }) => (
    <View style={styles.footer} fixed>
        <Text style={styles.footerText}>© {new Date().getFullYear()} SEQ Drone Inspections Pty Ltd</Text>
        <Text style={styles.footerText}>{date}</Text>
        <Text style={styles.footerPageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        <View style={styles.footerAccent} />
    </View>
);

const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const SeverityDot = ({ severity, size = 6 }: { severity: string; size?: number }) => (
    <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getSeverityColor(severity),
    }} />
);

// ── Main Document Component ────────────────────────────────────────────────────

export const ReportDocument = ({ jobData, analysisResult, images, imageDates, imageCoords, imageScales }: ReportDocumentProps) => {
    const reportDate = new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const reportDateShort = new Date().toLocaleDateString('en-AU', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const damages = analysisResult.damages || [];
    const healthScore = analysisResult.assetHealthScore;
    const healthColor = getHealthColor(healthScore);

    // Count findings by severity
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    damages.forEach(d => {
        if (d.severity in severityCounts) {
            severityCounts[d.severity as keyof typeof severityCounts]++;
        }
    });
    const totalFindings = damages.length;

    // Count findings per image
    const findingsPerImage: Record<number, number> = {};
    damages.forEach(d => {
        findingsPerImage[d.imageIndex] = (findingsPerImage[d.imageIndex] || 0) + 1;
    });

    // Type labels
    const typeLabels: Record<string, string> = {
        'roof': 'Roof Inspection',
        'solar': 'Solar Panel Inspection',
        'facade': 'Facade Inspection',
        'bridge': 'Bridge Inspection',
        'tower': 'Tower Inspection',
        'turbine': 'Turbine Inspection',
        'tank': 'Tank Inspection',
    };
    const inspectionType = typeLabels[jobData.type] || 'Asset Inspection';

    return (
        <Document>
            {/* ═══════════════════════ COVER PAGE ═══════════════════════ */}
            <Page size="A4" style={styles.coverPage}>
                <View style={styles.coverAccent} />
                <View style={styles.coverContent}>
                    {/* Top: Branding */}
                    <View>
                        <View style={styles.coverTopSection}>
                            <Text style={styles.coverCompanyName}>SEQ Drone Inspections</Text>
                            <Text style={styles.coverCompanyTagline}>Professional Aerial Asset Intelligence</Text>
                        </View>

                        <View style={styles.coverDivider} />

                        {/* Title */}
                        <Text style={styles.coverTitle}>{inspectionType}{'\n'}Report</Text>
                        <Text style={styles.coverSubtitle}>
                            {jobData.title || 'Untitled Asset'} — {jobData.location || 'Location not specified'}
                        </Text>

                        {/* Health Score Badge */}
                        <View style={styles.coverHealthBadge}>
                            <View style={[styles.coverHealthScore, { backgroundColor: healthColor }]}>
                                <Text style={styles.coverHealthValue}>{healthScore}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.textPrimary }}>
                                    {getHealthLabel(healthScore)}
                                </Text>
                                <Text style={styles.coverHealthLabel}>
                                    {totalFindings} finding{totalFindings !== 1 ? 's' : ''} identified across {images.length} image{images.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Metadata Grid */}
                        <View style={styles.coverMetaGrid}>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Client</Text>
                                <Text style={styles.coverMetaValue}>{jobData.clientName || '—'}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Report Date</Text>
                                <Text style={styles.coverMetaValue}>{reportDate}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Survey Reference</Text>
                                <Text style={styles.coverMetaValue}>{jobData.id || '—'}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Asset Location</Text>
                                <Text style={styles.coverMetaValue}>{jobData.location || '—'}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Inspection Type</Text>
                                <Text style={styles.coverMetaValue}>{inspectionType}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Images Analyzed</Text>
                                <Text style={styles.coverMetaValue}>{images.length}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.coverFooter}>
                        <View>
                            <Text style={styles.coverFooterText}>Generated by SEQ Drone AI Vision Engine</Text>
                            <Text style={styles.coverFooterText}>ABN: XX XXX XXX XXX</Text>
                        </View>
                        <Text style={styles.coverConfidential}>Confidential</Text>
                    </View>
                </View>
            </Page>

            {/* ═══════════════════════ SUMMARY DASHBOARD ═══════════════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} jobId={jobData.id} />
                <View style={styles.content}>
                    <SectionHeader title="Inspection Summary" />

                    {/* KPI Cards */}
                    <View style={styles.dashboardRow}>
                        <View style={styles.dashboardCard}>
                            <Text style={[styles.dashboardValue, { color: healthColor }]}>{healthScore}</Text>
                            <Text style={styles.dashboardLabel}>Health Score</Text>
                        </View>
                        <View style={styles.dashboardCard}>
                            <Text style={styles.dashboardValue}>{totalFindings}</Text>
                            <Text style={styles.dashboardLabel}>Total Findings</Text>
                        </View>
                        <View style={styles.dashboardCard}>
                            <Text style={styles.dashboardValue}>{images.length}</Text>
                            <Text style={styles.dashboardLabel}>Images Analyzed</Text>
                        </View>
                        <View style={styles.dashboardCard}>
                            <Text style={[styles.dashboardValue, {
                                color: getSeverityColor(
                                    severityCounts.Critical > 0 ? 'Critical' :
                                        severityCounts.High > 0 ? 'High' :
                                            severityCounts.Medium > 0 ? 'Medium' : 'Low'
                                )
                            }]}>
                                {severityCounts.Critical > 0 ? 'Critical' :
                                    severityCounts.High > 0 ? 'High' :
                                        severityCounts.Medium > 0 ? 'Medium' : 'Low'}
                            </Text>
                            <Text style={styles.dashboardLabel}>Highest Severity</Text>
                        </View>
                    </View>

                    {/* Severity Breakdown */}
                    <Text style={styles.sectionSubtitle}>Severity Distribution</Text>
                    {(['Critical', 'High', 'Medium', 'Low'] as const).map(level => {
                        const count = severityCounts[level];
                        const percentage = totalFindings > 0 ? (count / totalFindings) * 100 : 0;
                        return (
                            <View key={level} style={styles.severityRow}>
                                <Text style={[styles.severityLabel, { color: getSeverityColor(level) }]}>{level}</Text>
                                <View style={styles.severityBarContainer}>
                                    {percentage > 0 && (
                                        <View style={[styles.severityBar, {
                                            width: `${Math.max(percentage, 8)}%`,
                                            backgroundColor: getSeverityColor(level)
                                        }]}>
                                            <Text style={styles.severityBarText}>{count}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.severityCount, { color: getSeverityColor(level) }]}>{count}</Text>
                            </View>
                        );
                    })}

                    {/* Executive Summary */}
                    <View style={{ marginTop: 16 }}>
                        <Text style={styles.sectionSubtitle}>Executive Summary</Text>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryText}>{analysisResult.summary}</Text>
                        </View>
                    </View>

                    {/* Findings Summary Table */}
                    <Text style={styles.sectionSubtitle}>Findings Overview</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { width: '6%' }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Finding</Text>
                            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Severity</Text>
                            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Condition</Text>
                            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Component</Text>
                            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Confidence</Text>
                        </View>
                        {damages.map((damage, index) => (
                            <View key={damage.id || index} style={styles.tableRow}>
                                <Text style={[styles.tableCellBold, { width: '6%' }]}>{index + 1}</Text>
                                <Text style={[styles.tableCellBold, { width: '30%' }]}>{damage.title}</Text>
                                <Text style={[styles.tableCell, { width: '14%', color: getSeverityColor(damage.severity) }]}>
                                    {damage.severity}
                                </Text>
                                <Text style={[styles.tableCell, { width: '14%', color: getConditionColor(damage.conditionRating) }]}>
                                    {damage.conditionRating}
                                </Text>
                                <Text style={[styles.tableCell, { width: '20%' }]}>{damage.component || '—'}</Text>
                                <Text style={[styles.tableCell, { width: '16%' }]}>
                                    {damage.confidenceScore ? `${damage.confidenceScore}%` : '—'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>

            {/* ═══════════════════════ IMAGE GALLERY ═══════════════════════ */}
            {images.length > 1 && (
                <Page size="A4" style={styles.page}>
                    <PageHeader title={jobData.title} jobId={jobData.id} />
                    <View style={styles.content}>
                        <SectionHeader title="Survey Images" />
                        <Text style={styles.sectionSubtitle}>
                            {images.length} images captured during inspection flight
                        </Text>
                        <View style={styles.galleryGrid}>
                            {images.map((img, idx) => (
                                <View key={`gallery-${idx}`} style={styles.galleryItem}>
                                    <Image src={img} style={styles.galleryImage} />
                                    <View style={styles.galleryCaption}>
                                        <Text style={styles.galleryCaptionText}>Image {idx + 1}</Text>
                                        <Text style={styles.galleryCaptionFindings}>
                                            {findingsPerImage[idx] || 0} finding{(findingsPerImage[idx] || 0) !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                    <PageFooter date={reportDateShort} />
                </Page>
            )}

            {/* ═══════════════════════ FINDING PAGES ═══════════════════════ */}
            {damages.map((damage, index) => {
                const severityColor = getSeverityColor(damage.severity);
                const severityBg = getSeverityBg(damage.severity);
                const priorityScore = calculatePriorityScore(
                    damage.severity,
                    damage.conditionRating,
                    damage.confidenceScore || 75
                );
                const imageIdx = damage.imageIndex ?? 0;
                const safeImageIdx = imageIdx < images.length ? imageIdx : 0;
                const imageSrc = images[safeImageIdx];
                const imageDate = imageDates?.[safeImageIdx];
                const imageCoord = imageCoords?.[safeImageIdx];
                const imageScale = imageScales?.[safeImageIdx];

                // No longer calculating zoomed view from polygon since we just use focalPoint
                // which is already a single [y,x] coordinate

                return (
                    <Page key={damage.id || `finding-${index}`} size="A4" style={styles.page}>
                        <PageHeader title={jobData.title} jobId={jobData.id} />
                        <View style={styles.content}>
                            {/* Finding Header */}
                            <View style={styles.findingHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.findingNumber}>Finding {index + 1} of {totalFindings}</Text>
                                    <Text style={styles.findingTitle}>{damage.title}</Text>
                                    {damage.areaLocation && (
                                        <Text style={styles.findingLocation}>{damage.areaLocation}</Text>
                                    )}
                                </View>
                                <View style={[styles.findingSeverityBadge, { backgroundColor: severityColor }]}>
                                    <Text style={styles.findingSeverityText}>{damage.severity}</Text>
                                </View>
                            </View>

                            {/* Context Image with Polygon Overlay */}
                            {imageSrc && (
                                <View style={styles.findingImageContainer}>
                                    <Image src={imageSrc} style={styles.findingImage} />

                                    {/* SVG overlay for Focal Point Marker */}
                                    {damage.focalPoint && (
                                        <Svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                        }}>
                                            {/* Focal point pulse circle */}
                                            <Circle
                                                cx={damage.focalPoint[1]}
                                                cy={damage.focalPoint[0]}
                                                r={16}
                                                fill="none"
                                                stroke={severityColor}
                                                strokeWidth={2}
                                                strokeDasharray="4,4"
                                            />
                                            <Circle
                                                cx={damage.focalPoint[1]}
                                                cy={damage.focalPoint[0]}
                                                r={4}
                                                fill={severityColor}
                                            />
                                            {/* Crosshair lines */}
                                            <Line
                                                x1={damage.focalPoint[1] - 22}
                                                y1={damage.focalPoint[0]}
                                                x2={damage.focalPoint[1] - 12}
                                                y2={damage.focalPoint[0]}
                                                stroke={severityColor}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                x1={damage.focalPoint[1] + 12}
                                                y1={damage.focalPoint[0]}
                                                x2={damage.focalPoint[1] + 22}
                                                y2={damage.focalPoint[0]}
                                                stroke={severityColor}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                x1={damage.focalPoint[1]}
                                                y1={damage.focalPoint[0] - 22}
                                                x2={damage.focalPoint[1]}
                                                y2={damage.focalPoint[0] - 12}
                                                stroke={severityColor}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                x1={damage.focalPoint[1]}
                                                y1={damage.focalPoint[0] + 12}
                                                x2={damage.focalPoint[1]}
                                                y2={damage.focalPoint[0] + 22}
                                                stroke={severityColor}
                                                strokeWidth={2}
                                            />
                                        </Svg>
                                    )}

                                    {/* Image label */}
                                    <View style={styles.findingImageLabel}>
                                        <Text style={styles.findingImageLabelText}>Image {safeImageIdx + 1}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Detail Cards Grid */}
                            <View style={styles.findingDetailGrid}>
                                <View style={styles.findingDetailCard}>
                                    <Text style={styles.findingDetailLabel}>Component</Text>
                                    <Text style={styles.findingDetailValue}>{damage.component || '—'}</Text>
                                </View>
                                <View style={styles.findingDetailCard}>
                                    <Text style={styles.findingDetailLabel}>Defect Type</Text>
                                    <Text style={styles.findingDetailValue}>{damage.defectType || '—'}</Text>
                                </View>
                                <View style={[styles.findingDetailCard, { borderLeftWidth: 2, borderLeftColor: getConditionColor(damage.conditionRating) }]}>
                                    <Text style={styles.findingDetailLabel}>Condition</Text>
                                    <Text style={[styles.findingDetailValue, { color: getConditionColor(damage.conditionRating) }]}>
                                        {damage.conditionRating}
                                    </Text>
                                </View>
                            </View>

                            {/* Second row: Confidence, Est. Size, Priority */}
                            <View style={styles.findingDetailGrid}>
                                <View style={styles.findingDetailCard}>
                                    <Text style={styles.findingDetailLabel}>Confidence</Text>
                                    <Text style={styles.findingDetailValue}>
                                        {damage.confidenceScore ? `${damage.confidenceScore}%` : '—'}
                                    </Text>
                                </View>
                                {damage.estimatedSize && (
                                    <View style={styles.findingDetailCard}>
                                        <Text style={styles.findingDetailLabel}>Estimated Size</Text>
                                        <Text style={styles.findingDetailValue}>{damage.estimatedSize}</Text>
                                    </View>
                                )}
                                <View style={[styles.findingDetailCard, { borderLeftWidth: 2, borderLeftColor: COLORS.brand }]}>
                                    <Text style={styles.findingDetailLabel}>Priority Score</Text>
                                    <Text style={[styles.findingDetailValue, { color: COLORS.brand }]}>{priorityScore}/100</Text>
                                </View>
                            </View>

                            {/* GPS & Date if available */}
                            {(imageCoord || imageDate || imageScale) && (
                                <View style={[styles.findingDetailGrid, { marginBottom: 8 }]}>
                                    {imageCoord && imageCoord.lat !== 0 && (
                                        <View style={styles.findingDetailCard}>
                                            <Text style={styles.findingDetailLabel}>GPS Coordinates</Text>
                                            <Text style={styles.findingDetailValue}>
                                                {imageCoord.lat.toFixed(6)}, {imageCoord.lng.toFixed(6)}
                                            </Text>
                                        </View>
                                    )}
                                    {imageDate && (
                                        <View style={styles.findingDetailCard}>
                                            <Text style={styles.findingDetailLabel}>Image Date</Text>
                                            <Text style={styles.findingDetailValue}>{imageDate}</Text>
                                        </View>
                                    )}
                                    {imageScale && imageScale > 0 && (
                                        <View style={styles.findingDetailCard}>
                                            <Text style={styles.findingDetailLabel}>Scale Factor</Text>
                                            <Text style={styles.findingDetailValue}>{imageScale.toFixed(1)} px/m</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Description */}
                            <View style={styles.findingDescription}>
                                <Text style={styles.findingDescLabel}>Visual Evidence</Text>
                                <Text style={styles.findingDescText}>{damage.description}</Text>
                            </View>

                            {/* Recommendation */}
                            <View style={[styles.recommendationBox, {
                                backgroundColor: severityBg,
                                borderColor: `${severityColor}40`,
                                borderLeftColor: severityColor,
                            }]}>
                                <Text style={[styles.recommendationLabel, { color: severityColor }]}>
                                    Recommended Action
                                </Text>
                                <Text style={[styles.recommendationText, { color: '#334155' }]}>
                                    {damage.recommendation}
                                </Text>
                            </View>

                            {/* Comparison Data if available */}
                            {damage.comparisonData && damage.comparisonData.status !== 'New' && (
                                <View style={[styles.findingDetailCard, { marginTop: 4 }]}>
                                    <Text style={styles.findingDetailLabel}>Historical Comparison</Text>
                                    <Text style={styles.findingDetailValue}>
                                        {damage.comparisonData.status} — {damage.comparisonData.percentChange > 0 ? '+' : ''}
                                        {damage.comparisonData.percentChange}% change from previous survey
                                    </Text>
                                </View>
                            )}
                        </View>
                        <PageFooter date={reportDateShort} />
                    </Page>
                );
            })}

            {/* ═══════════════════════ DISCLAIMER PAGE ═══════════════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} jobId={jobData.id} />
                <View style={styles.content}>
                    <SectionHeader title="Terms & Disclaimer" />

                    <View style={styles.summaryBox}>
                        <Text style={[styles.findingDescLabel, { marginBottom: 8 }]}>Scope of Inspection</Text>
                        <Text style={styles.summaryText}>
                            This report presents the findings of a drone-based visual inspection conducted by SEQ Drone Inspections Pty Ltd.
                            The inspection was limited to areas accessible by the drone and visible in the captured imagery.
                            This inspection is visual only and does not constitute a structural engineering assessment.
                        </Text>
                    </View>

                    <View style={styles.summaryBox}>
                        <Text style={[styles.findingDescLabel, { marginBottom: 8 }]}>AI-Assisted Analysis</Text>
                        <Text style={styles.summaryText}>
                            Defect identification and classification in this report were assisted by artificial intelligence technology.
                            All AI-generated findings have been reviewed by the operator. The confidence scores indicate the AI&apos;s
                            certainty level for each finding. Professional assessment by a qualified tradesperson or engineer is recommended
                            before undertaking any remediation works.
                        </Text>
                    </View>

                    <View style={styles.summaryBox}>
                        <Text style={[styles.findingDescLabel, { marginBottom: 8 }]}>Limitation of Liability</Text>
                        <Text style={styles.summaryText}>
                            SEQ Drone Inspections Pty Ltd has exercised reasonable care in conducting this inspection and preparing this report.
                            No warranty is given as to the completeness of the inspection or the accuracy of the findings.
                            Defects may exist that were not visible in the drone imagery or detectable by the AI analysis system.
                            This report should not be relied upon as the sole basis for any construction, maintenance, or investment decision.
                        </Text>
                    </View>

                    <View style={[styles.summaryBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <Text style={[styles.findingDescLabel, { marginBottom: 8, color: COLORS.brand }]}>Contact</Text>
                        <Text style={styles.summaryText}>
                            For questions regarding this report or to schedule a follow-up inspection, please contact SEQ Drone Inspections.
                        </Text>
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>
        </Document>
    );
};
