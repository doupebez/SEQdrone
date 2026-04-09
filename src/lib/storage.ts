import { JobData } from '@/components/JobContextForm';
import { createClient } from '@/lib/supabase/client';

export interface Damage {
    id: string;
    title: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    defectType: string;
    conditionRating: string;
    description: string;
    recommendation: string;
    focalPoint: number[];
    polygon?: number[][];
    imageIndex: number;
    areaLocation?: string;
    estimatedSize?: string;
    component?: string;
    confidenceScore?: number;
    parentFindingId?: string;
    comparisonData?: {
        previousArea: number;
        currentArea: number;
        percentChange: number;
        status: 'Growing' | 'Stable' | 'Shrinking' | 'New';
    };
    annotations?: any[];
}

// ──── Height Safety Types ────

export interface HeightSafetyEquipment {
    id: string;
    location: string;
    equipmentType: string;
    fixingMethod: string;
    ratingKN: string;
    testMethod: string;
    ropeAccess: boolean;
    fallArrest: boolean;
    result: 'Pass' | 'Fail' | 'No Access';
}

export interface HeightSafetyDefect {
    id: string;
    equipmentIds: string;
    location: string;
    riskRating: 'Low' | 'Medium' | 'High' | 'Extreme';
    description: string;
    safeForTempUse: boolean;
    resolution: string;
    photo?: string;
}

export interface HeightSafetyInspection {
    inspectorName: string;
    inspectorCert: string;
    inspectorCompany: string;
    buildingName: string;
    buildingAddress: string;
    buildingDescription: string;
    inspectionDate: string;
    nextDueDate: string;
    equipment: HeightSafetyEquipment[];
    defects: HeightSafetyDefect[];
    conclusion: string;
}

export interface SurveyRecord {
    id: string;
    date: string;
    jobData: JobData;
    analysisResult: {
        summary: string;
        damages: Damage[];
        assetHealthScore: number;
        assetPolygon?: number[][];
    };
    thumbnail: string;
    findingCount: number;
    healthScore?: number;
    status: 'Draft' | 'Finalized';
}

// ──── Survey Storage (Supabase) ────

export const storage = {
    saveSurvey: async (record: SurveyRecord, userId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('surveys')
            .upsert({
                id: record.id,
                user_id: userId,
                date: record.date,
                job_data: record.jobData,
                analysis_result: record.analysisResult,
                thumbnail_url: record.thumbnail,
                finding_count: record.findingCount,
                health_score: record.healthScore,
                status: record.status,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('Failed to save survey:', error);
            throw error;
        }
    },

    getHistory: async (userId: string): Promise<SurveyRecord[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Failed to fetch survey history:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            date: row.date,
            jobData: row.job_data as JobData,
            analysisResult: row.analysis_result as SurveyRecord['analysisResult'],
            thumbnail: row.thumbnail_url || '',
            findingCount: row.finding_count || 0,
            healthScore: row.health_score,
            status: row.status as 'Draft' | 'Finalized',
        }));
    },

    getSurvey: async (id: string): Promise<SurveyRecord | undefined> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            date: data.date,
            jobData: data.job_data as JobData,
            analysisResult: data.analysis_result as SurveyRecord['analysisResult'],
            thumbnail: data.thumbnail_url || '',
            findingCount: data.finding_count || 0,
            healthScore: data.health_score,
            status: data.status as 'Draft' | 'Finalized',
        };
    },

    deleteSurvey: async (id: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Failed to delete survey:', error);
            throw error;
        }
    }
};

// ──── Training Feedback & Rules (Supabase) ────

export interface TrainingFeedback {
    id: string;
    surveyId: string;
    surveyTitle: string;
    findingId?: string;
    findingTitle?: string;
    comment: string;
    category: 'false_positive' | 'missed_defect' | 'wrong_severity' | 'wrong_category' | 'good_detection' | 'general';
    createdAt: string;
}

export interface TrainingRule {
    id: string;
    rule: string;
    source: string;
    createdAt: string;
    active: boolean;
}

export const trainingStorage = {
    // ── Feedback ──
    saveFeedback: async (feedback: TrainingFeedback, userId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('training_feedback')
            .insert({
                id: feedback.id,
                user_id: userId,
                survey_id: feedback.surveyId,
                survey_title: feedback.surveyTitle,
                finding_id: feedback.findingId,
                finding_title: feedback.findingTitle,
                comment: feedback.comment,
                category: feedback.category,
                created_at: feedback.createdAt,
            });

        if (error) {
            console.error('Failed to save feedback:', error);
            throw error;
        }
    },

    getAllFeedback: async (userId: string): Promise<TrainingFeedback[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('training_feedback')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch feedback:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            surveyId: row.survey_id,
            surveyTitle: row.survey_title,
            findingId: row.finding_id,
            findingTitle: row.finding_title,
            comment: row.comment,
            category: row.category as TrainingFeedback['category'],
            createdAt: row.created_at,
        }));
    },

    deleteFeedback: async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('training_feedback').delete().eq('id', id);
        if (error) console.error('Failed to delete feedback:', error);
    },

    // ── Rules ──
    saveRule: async (rule: TrainingRule, userId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('training_rules')
            .insert({
                id: rule.id,
                user_id: userId,
                rule: rule.rule,
                source: rule.source,
                active: rule.active,
                created_at: rule.createdAt,
            });

        if (error) {
            console.error('Failed to save rule:', error);
            throw error;
        }
    },

    setAllRules: async (rules: TrainingRule[], userId: string) => {
        const supabase = createClient();

        // Delete existing rules for the user first
        await supabase.from('training_rules').delete().eq('user_id', userId);

        if (rules.length === 0) return;

        const { error } = await supabase
            .from('training_rules')
            .insert(rules.map(r => ({
                id: r.id,
                user_id: userId,
                rule: r.rule,
                source: r.source,
                active: r.active,
                created_at: r.createdAt,
            })));

        if (error) {
            console.error('Failed to set rules:', error);
            throw error;
        }
    },

    getAllRules: async (userId: string): Promise<TrainingRule[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('training_rules')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch rules:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            rule: row.rule,
            source: row.source,
            createdAt: row.created_at,
            active: row.active,
        }));
    },

    getActiveRules: async (userId: string): Promise<TrainingRule[]> => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('training_rules')
            .select('*')
            .eq('user_id', userId)
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch active rules:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            rule: row.rule,
            source: row.source,
            createdAt: row.created_at,
            active: row.active,
        }));
    },

    toggleRule: async (id: string, currentActive: boolean) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('training_rules')
            .update({ active: !currentActive })
            .eq('id', id);

        if (error) console.error('Failed to toggle rule:', error);
    },

    deleteRule: async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('training_rules').delete().eq('id', id);
        if (error) console.error('Failed to delete rule:', error);
    }
};
