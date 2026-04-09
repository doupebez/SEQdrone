'use client';

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { HeightSafetyInspection, HeightSafetyEquipment, HeightSafetyDefect } from '@/lib/storage';

// ── Color System (matches existing ReportDocument) ──

const COLORS = {
    brand: '#0f74c5',
    brandDark: '#0a528c',
    brandLight: '#e6f0f9',
    dark: '#0c1220',
    darkSurface: '#111827',
    darkCard: '#1a2236',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#1e293b',
    borderLight: '#334155',
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    white: '#ffffff',
    pageBackground: '#f8fafc',
    cardBackground: '#ffffff',
    pass: '#22c55e',
    fail: '#ef4444',
    noAccess: '#f59e0b',
    extreme: '#dc2626',
};

const getRiskColor = (rating: string) => {
    switch (rating) {
        case 'Extreme': return COLORS.extreme;
        case 'High': return COLORS.high;
        case 'Medium': return COLORS.medium;
        case 'Low': return COLORS.low;
        default: return COLORS.textMuted;
    }
};

const getResultColor = (result: string) => {
    switch (result) {
        case 'Pass': return COLORS.pass;
        case 'Fail': return COLORS.fail;
        case 'No Access': return COLORS.noAccess;
        default: return COLORS.textMuted;
    }
};

// ── Styles ──

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1e293b',
        backgroundColor: COLORS.pageBackground,
        position: 'relative',
        paddingTop: 65,
        paddingBottom: 65,
    },
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
        fontSize: 28,
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
    // Summary badge
    coverSummaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    coverSummaryCard: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1e293b',
        alignItems: 'center',
    },
    coverSummaryValue: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    coverSummaryLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Header / Footer
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
    headerTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
    },
    headerRef: {
        fontSize: 7,
        color: COLORS.textMuted,
    },
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
    // Content
    content: {
        paddingHorizontal: 40,
        paddingTop: 16,
    },
    // Sections
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
    // Cards
    cardBox: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    bodyText: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.6,
    },
    boldText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    smallLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    // Tables
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
        padding: 6,
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
        padding: 6,
    },
    tableCellBold: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        padding: 6,
    },
    // Defect page
    defectCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    defectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    defectBody: {
        padding: 14,
    },
    defectGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    defectGridItem: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    riskBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    riskBadgeText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.white,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    defectImage: {
        width: '100%',
        height: 200,
        objectFit: 'cover',
        borderRadius: 6,
        marginBottom: 10,
    },
    // Standards list
    standardItem: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 4,
        paddingLeft: 8,
    },
    standardBullet: {
        fontSize: 9,
        color: COLORS.brand,
        fontFamily: 'Helvetica-Bold',
    },
    standardText: {
        fontSize: 9,
        color: '#475569',
        flex: 1,
    },
    // Info grid
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 0,
    },
    infoItem: {
        width: '50%',
        paddingVertical: 8,
        paddingRight: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: {
        fontSize: 7,
        color: COLORS.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
});

// ── Helper Components ──

const PageHeader = ({ title }: { title: string }) => (
    <View style={styles.header} fixed>
        <View style={styles.headerLeft}>
            <View style={styles.headerBrandDot} />
            <Text style={styles.headerCompany}>SEQ Drone Inspections</Text>
        </View>
        <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerRef}>Height Safety Inspection Report</Text>
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

// ── Props ──

interface HeightSafetyReportProps {
    jobData: {
        id: string;
        title: string;
        clientName: string;
        location: string;
    };
    inspection: HeightSafetyInspection;
}

// ── Main Document ──

export const HeightSafetyReport = ({ jobData, inspection }: HeightSafetyReportProps) => {
    const reportDate = new Date().toLocaleDateString('en-AU', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const reportDateShort = new Date().toLocaleDateString('en-AU', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    const totalEquipment = inspection.equipment.length;
    const passCount = inspection.equipment.filter(e => e.result === 'Pass').length;
    const failCount = inspection.equipment.filter(e => e.result === 'Fail').length;
    const noAccessCount = inspection.equipment.filter(e => e.result === 'No Access').length;

    // Group equipment by location
    const locations = [...new Set(inspection.equipment.map(e => e.location))];

    // Chunk equipment per location into groups of 27 for table pagination
    const ROWS_PER_TABLE = 27;

    return (
        <Document>
            {/* ═══════════════ COVER PAGE ═══════════════ */}
            <Page size="A4" style={styles.coverPage}>
                <View style={styles.coverAccent} />
                <View style={styles.coverContent}>
                    <View>
                        <Text style={styles.coverCompanyName}>SEQ Drone Inspections</Text>
                        <Text style={styles.coverCompanyTagline}>Height Safety Division</Text>
                        <View style={styles.coverDivider} />
                        <Text style={styles.coverTitle}>Annual Height Safety{'\n'}Inspection & Certification</Text>
                        <Text style={styles.coverSubtitle}>{jobData.title} — {jobData.location}</Text>

                        {/* Summary */}
                        <View style={styles.coverSummaryRow}>
                            <View style={[styles.coverSummaryCard, { borderColor: COLORS.pass + '40' }]}>
                                <Text style={[styles.coverSummaryValue, { color: COLORS.pass }]}>{passCount}</Text>
                                <Text style={styles.coverSummaryLabel}>Certified</Text>
                            </View>
                            <View style={[styles.coverSummaryCard, { borderColor: COLORS.fail + '40' }]}>
                                <Text style={[styles.coverSummaryValue, { color: COLORS.fail }]}>{failCount}</Text>
                                <Text style={styles.coverSummaryLabel}>Failed</Text>
                            </View>
                            <View style={[styles.coverSummaryCard, { borderColor: COLORS.noAccess + '40' }]}>
                                <Text style={[styles.coverSummaryValue, { color: COLORS.noAccess }]}>{noAccessCount}</Text>
                                <Text style={styles.coverSummaryLabel}>No Access</Text>
                            </View>
                            <View style={[styles.coverSummaryCard, { borderColor: COLORS.brand + '40' }]}>
                                <Text style={[styles.coverSummaryValue, { color: COLORS.brand }]}>{totalEquipment}</Text>
                                <Text style={styles.coverSummaryLabel}>Total Items</Text>
                            </View>
                        </View>
                    </View>

                    <View>
                        <View style={styles.coverMetaGrid}>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Client</Text>
                                <Text style={styles.coverMetaValue}>{jobData.clientName}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Location</Text>
                                <Text style={styles.coverMetaValue}>{jobData.location}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Inspection Date</Text>
                                <Text style={styles.coverMetaValue}>{inspection.inspectionDate || reportDate}</Text>
                            </View>
                            <View style={styles.coverMetaItem}>
                                <Text style={styles.coverMetaLabel}>Next Due</Text>
                                <Text style={styles.coverMetaValue}>{inspection.nextDueDate || '12 months'}</Text>
                            </View>
                        </View>
                        <View style={styles.coverFooter}>
                            <Text style={styles.coverFooterText}>Prepared by {inspection.inspectorName || 'SEQ Drone Inspections'}</Text>
                            <Text style={styles.coverConfidential}>Confidential</Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* ═══════════════ AUSTRALIAN STANDARDS ═══════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} />
                <View style={styles.content}>
                    <SectionHeader title="Australian Standards" />
                    <View style={styles.cardBox}>
                        <Text style={styles.bodyText}>
                            Below is a summary of Australian Standards that your height safety systems are required to adhere to. This is not an exhaustive list but covers the most important aspects regarding anchor points in your roof safety system.
                        </Text>
                    </View>
                    <View style={styles.cardBox}>
                        {[
                            'AS 1891 – Horizontal Lifeline and Rail Systems – Prescribed Configurations',
                            'AS 1891.1 – Safety Belts and Harnesses',
                            'AS 1891.2 – Horizontal Lifeline and Rail Systems',
                            'AS 1891.3 – Fall Arrest Devices',
                            'AS 1891.4 – Selection, Use and Maintenance',
                            'AS 1657.2018 – Fixed Platforms, Walkways, Stairways, and Ladders',
                            'AS 5532.2013 – Manufacturing requirements for single point anchors',
                            'ISO 22846 – Personal equipment for protection against falls — Rope Access systems',
                        ].map((standard, i) => (
                            <View key={i} style={styles.standardItem}>
                                <Text style={styles.standardBullet}>•</Text>
                                <Text style={styles.standardText}>{standard}</Text>
                            </View>
                        ))}
                    </View>

                    <SectionHeader title="Certification" />
                    <View style={styles.cardBox}>
                        <Text style={styles.bodyText}>
                            Under the Australian Standard you are required to be inspected every 12 months. The next inspection will be due in twelve (12) months for the height safety system as per AS/NZS 1891.1-4 from the date of inspection on this document.
                        </Text>
                        <Text style={[styles.bodyText, { marginTop: 8 }]}>
                            In accordance with Australian Standards, all anchors need to be inspected and re-certified by a competent person on an annual basis. Upon re-certification, the system or anchor plaque should be updated. Systems and anchors that have not been certified for over 12 months should not be used.
                        </Text>
                    </View>

                    <SectionHeader title="Occupational Health & Safety Legislation" />
                    <View style={styles.cardBox}>
                        {[
                            'Work Health Safety Act 2011',
                            'Prevention of Falls in General Construction (2008)',
                            'Occupational Health and Safety Act 2004 (OHS Act)',
                            'Occupational Health and Safety Regulations 2017',
                        ].map((leg, i) => (
                            <View key={i} style={styles.standardItem}>
                                <Text style={styles.standardBullet}>•</Text>
                                <Text style={styles.standardText}>{leg}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>

            {/* ═══════════════ INSPECTION REQUIREMENTS ═══════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} />
                <View style={styles.content}>
                    <SectionHeader title="Inspection & Assessment" />
                    <View style={styles.cardBox}>
                        <Text style={[styles.boldText, { marginBottom: 6 }]}>For your height safety system to be certified, it must meet the following requirements:</Text>
                        {[
                            { label: 'Reliability', desc: 'There should be no question about the anchor\'s quality and configuration.' },
                            { label: 'Position', desc: 'The anchor should be positioned so that the operative\'s work position can be easily maintained.' },
                            { label: 'Safety', desc: 'Anchors should be placed where operators can connect and disconnect with minimal risk of a fall from height.' },
                            { label: 'Strength', desc: 'Static strength of at least 12kN for abseil use, 15kN for fall arrest, or 21kN for a 2-person connection.' },
                            { label: 'Permanence', desc: 'Permanent anchors must carry manufacturer/installer details, load rating, direction, and service status.' },
                        ].map((req, i) => (
                            <View key={i} style={{ marginBottom: 6, paddingLeft: 8 }}>
                                <Text style={styles.boldText}>{req.label}:</Text>
                                <Text style={styles.bodyText}>{req.desc}</Text>
                            </View>
                        ))}
                    </View>

                    <SectionHeader title="Risk Assessment" />
                    <View style={styles.cardBox}>
                        <Text style={styles.bodyText}>
                            If any equipment fails testing or does not meet compliance, a risk assessment is carried out and a rating is assigned based on consequence and probability (Low, Medium, High, or Extreme). The higher the probability and consequence, the higher the risk to your business or the worker.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            {['Low', 'Medium', 'High', 'Extreme'].map((level) => (
                                <View key={level} style={{ flex: 1, padding: 8, borderRadius: 4, backgroundColor: getRiskColor(level) + '15', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: getRiskColor(level) }}>{level}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <SectionHeader title="Hierarchy of Control" />
                    <View style={styles.cardBox}>
                        {[
                            { label: 'Elimination', desc: 'Remove the hazard altogether at design or planning stage.' },
                            { label: 'Substitution', desc: 'Replace with a safer alternative process or product.' },
                            { label: 'Engineering Control', desc: 'Isolate the hazard at its source before it impacts workers.' },
                            { label: 'Administrative Control', desc: 'Documented procedures, training, and signage.' },
                            { label: 'PPE', desc: 'Personal Protective Equipment as a last resort or in combination with other controls.' },
                        ].map((item, i) => (
                            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 4 }}>
                                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.brand, width: 14 }}>{i + 1}.</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.boldText}>{item.label}</Text>
                                    <Text style={styles.bodyText}>{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>

            {/* ═══════════════ INSPECTOR & SYSTEM DETAILS ═══════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} />
                <View style={styles.content}>
                    <SectionHeader title="Inspector & System Details" />
                    <View style={styles.cardBox}>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Inspector</Text>
                                <Text style={styles.infoValue}>{inspection.inspectorName || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Licence / Cert</Text>
                                <Text style={styles.infoValue}>{inspection.inspectorCert || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Company</Text>
                                <Text style={styles.infoValue}>{inspection.inspectorCompany || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Client</Text>
                                <Text style={styles.infoValue}>{jobData.clientName}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Building</Text>
                                <Text style={styles.infoValue}>{inspection.buildingName || jobData.title}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Address</Text>
                                <Text style={styles.infoValue}>{inspection.buildingAddress || jobData.location}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Inspection Date</Text>
                                <Text style={styles.infoValue}>{inspection.inspectionDate || reportDate}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Next Due Date</Text>
                                <Text style={styles.infoValue}>{inspection.nextDueDate || '—'}</Text>
                            </View>
                        </View>
                    </View>
                    {inspection.buildingDescription && (
                        <>
                            <Text style={[styles.smallLabel, { marginTop: 8 }]}>Building Description</Text>
                            <View style={styles.cardBox}>
                                <Text style={styles.bodyText}>{inspection.buildingDescription}</Text>
                            </View>
                        </>
                    )}

                    {/* Summary dashboard */}
                    <SectionHeader title="Inspection Summary" />
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                        {[
                            { label: 'Total Inspected', value: String(totalEquipment), color: COLORS.brand },
                            { label: 'Certified (Pass)', value: String(passCount), color: COLORS.pass },
                            { label: 'Failed', value: String(failCount), color: COLORS.fail },
                            { label: 'No Access', value: String(noAccessCount), color: COLORS.noAccess },
                        ].map((stat, i) => (
                            <View key={i} style={{
                                flex: 1, backgroundColor: COLORS.cardBackground, borderRadius: 8,
                                padding: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
                            }}>
                                <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: stat.color, marginBottom: 2 }}>{stat.value}</Text>
                                <Text style={{ fontSize: 7, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                        <View style={{
                            flex: 1, backgroundColor: failCount > 0 ? '#fef2f2' : '#f0fdf4',
                            borderRadius: 8, padding: 14, borderWidth: 1,
                            borderColor: failCount > 0 ? '#fecaca' : '#bbf7d0',
                        }}>
                            <Text style={{
                                fontSize: 9, fontFamily: 'Helvetica-Bold',
                                color: failCount > 0 ? COLORS.fail : COLORS.pass,
                                marginBottom: 4,
                            }}>
                                {failCount > 0 ? 'Corrective Action Required' : 'All Items Compliant'}
                            </Text>
                            <Text style={styles.bodyText}>
                                {failCount > 0
                                    ? `${failCount} item(s) require corrective action. See Defects section for details.`
                                    : 'All inspected height safety equipment has passed certification.'}
                            </Text>
                        </View>
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>

            {/* ═══════════════ INSPECTION RESULTS BY LOCATION ═══════════════ */}
            {locations.map((location) => {
                const items = inspection.equipment.filter(e => e.location === location);
                const chunks: HeightSafetyEquipment[][] = [];
                for (let i = 0; i < items.length; i += ROWS_PER_TABLE) {
                    chunks.push(items.slice(i, i + ROWS_PER_TABLE));
                }

                return chunks.map((chunk, chunkIdx) => (
                    <Page key={`${location}-${chunkIdx}`} size="A4" style={styles.page}>
                        <PageHeader title={jobData.title} />
                        <View style={styles.content}>
                            <SectionHeader title={`Inspection Results: ${location}${chunks.length > 1 ? ` (${chunkIdx + 1}/${chunks.length})` : ''}`} />
                            <View style={styles.table}>
                                {/* Header */}
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderCell, { width: '8%' }]}>ID</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Equipment Type</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Fixing Method</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '8%' }]}>kN</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Test Method</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Rope Access</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Fall Arrest</Text>
                                    <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Result</Text>
                                </View>
                                {/* Rows */}
                                {chunk.map((item, rowIdx) => (
                                    <View key={rowIdx} style={[styles.tableRow, rowIdx % 2 === 0 ? {} : { backgroundColor: '#f8fafc' }]}>
                                        <Text style={[styles.tableCellBold, { width: '8%' }]}>{item.id}</Text>
                                        <Text style={[styles.tableCell, { width: '18%' }]}>{item.equipmentType}</Text>
                                        <Text style={[styles.tableCell, { width: '14%' }]}>{item.fixingMethod}</Text>
                                        <Text style={[styles.tableCell, { width: '8%' }]}>{item.ratingKN}</Text>
                                        <Text style={[styles.tableCell, { width: '14%' }]}>{item.testMethod}</Text>
                                        <Text style={[styles.tableCell, { width: '10%' }]}>{item.ropeAccess ? '✓' : ''}</Text>
                                        <Text style={[styles.tableCell, { width: '10%' }]}>{item.fallArrest ? '✓' : ''}</Text>
                                        <Text style={[styles.tableCell, {
                                            width: '12%',
                                            fontFamily: 'Helvetica-Bold',
                                            color: getResultColor(item.result),
                                        }]}>{item.result}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <PageFooter date={reportDateShort} />
                    </Page>
                ));
            })}

            {/* ═══════════════ DEFECTS ═══════════════ */}
            {inspection.defects.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <PageHeader title={jobData.title} />
                    <View style={styles.content}>
                        <SectionHeader title="Defects: Detailed Breakdown" />
                        <View style={styles.cardBox}>
                            <Text style={styles.bodyText}>
                                Below is a detailed breakdown of each component that has FAILED (Non-Compliant or Not Safe) the inspection. Each entry includes the defect description, risk rating, whether the item is safe for temporary use, and the recommended resolution.
                            </Text>
                        </View>

                        {inspection.defects.map((defect, i) => (
                            <View key={defect.id} style={styles.defectCard} wrap={false}>
                                <View style={styles.defectHeader}>
                                    <View>
                                        <Text style={[styles.smallLabel, { marginBottom: 0 }]}>Defect #{i + 1}</Text>
                                        <Text style={styles.boldText}>Equipment: {defect.equipmentIds}</Text>
                                    </View>
                                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(defect.riskRating) }]}>
                                        <Text style={styles.riskBadgeText}>{defect.riskRating} Risk</Text>
                                    </View>
                                </View>
                                <View style={styles.defectBody}>
                                    {defect.photo && (
                                        <Image src={defect.photo} style={styles.defectImage} />
                                    )}
                                    <View style={styles.defectGrid}>
                                        <View style={styles.defectGridItem}>
                                            <Text style={styles.smallLabel}>Location</Text>
                                            <Text style={styles.boldText}>{defect.location || '—'}</Text>
                                        </View>
                                        <View style={styles.defectGridItem}>
                                            <Text style={styles.smallLabel}>Risk Rating</Text>
                                            <Text style={[styles.boldText, { color: getRiskColor(defect.riskRating) }]}>{defect.riskRating}</Text>
                                        </View>
                                        <View style={styles.defectGridItem}>
                                            <Text style={styles.smallLabel}>Safe for Temp Use</Text>
                                            <Text style={[styles.boldText, { color: defect.safeForTempUse ? COLORS.pass : COLORS.fail }]}>
                                                {defect.safeForTempUse ? 'Yes' : 'No'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ marginBottom: 8 }}>
                                        <Text style={styles.smallLabel}>Defect Description</Text>
                                        <Text style={styles.bodyText}>{defect.description}</Text>
                                    </View>
                                    <View style={{
                                        borderRadius: 6, padding: 10, borderWidth: 1,
                                        borderLeftWidth: 3, borderColor: '#e2e8f0',
                                        borderLeftColor: COLORS.brand, backgroundColor: '#f8fafc',
                                    }}>
                                        <Text style={[styles.smallLabel, { color: COLORS.brand }]}>Resolution</Text>
                                        <Text style={styles.bodyText}>{defect.resolution}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                    <PageFooter date={reportDateShort} />
                </Page>
            )}

            {/* ═══════════════ CONCLUSION ═══════════════ */}
            <Page size="A4" style={styles.page}>
                <PageHeader title={jobData.title} />
                <View style={styles.content}>
                    <SectionHeader title="Conclusion" />
                    <View style={styles.cardBox}>
                        <Text style={styles.bodyText}>
                            {inspection.conclusion || 'No conclusion provided.'}
                        </Text>
                    </View>

                    {/* Signature section */}
                    <View style={{ marginTop: 40 }}>
                        <View style={{ flexDirection: 'row', gap: 40 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>Inspector</Text>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 30, marginTop: 4 }} />
                                <Text style={[styles.bodyText, { marginTop: 6 }]}>{inspection.inspectorName || '—'}</Text>
                                <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>{inspection.inspectorCompany || '—'}</Text>
                                <Text style={[styles.bodyText, { color: COLORS.textMuted }]}>Cert: {inspection.inspectorCert || '—'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>Date</Text>
                                <View style={{ borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 30, marginTop: 4 }} />
                                <Text style={[styles.bodyText, { marginTop: 6 }]}>{inspection.inspectionDate || reportDate}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <PageFooter date={reportDateShort} />
            </Page>
        </Document>
    );
};
