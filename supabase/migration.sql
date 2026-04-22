-- =============================================================
-- SEQDrone Live Migration — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Surveys (replaces localStorage SurveyRecord)
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT now(),
  job_data JSONB NOT NULL,
  analysis_result JSONB,
  thumbnail_url TEXT,
  finding_count INTEGER DEFAULT 0,
  health_score INTEGER,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Survey Images
CREATE TABLE IF NOT EXISTS survey_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id TEXT REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Training Feedback
CREATE TABLE IF NOT EXISTS training_feedback (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id TEXT REFERENCES surveys(id) ON DELETE SET NULL,
  survey_title TEXT,
  finding_id TEXT,
  finding_title TEXT,
  comment TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Training Rules
CREATE TABLE IF NOT EXISTS training_rules (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  source TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- Row-Level Security (RLS)
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_rules ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Surveys: users can only access their own surveys
CREATE POLICY "Users can view own surveys"
  ON surveys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own surveys"
  ON surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own surveys"
  ON surveys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own surveys"
  ON surveys FOR DELETE USING (auth.uid() = user_id);

-- Survey Images: users can only access their own images
CREATE POLICY "Users can view own images"
  ON survey_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images"
  ON survey_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own images"
  ON survey_images FOR DELETE USING (auth.uid() = user_id);

-- Training Feedback: users can only access their own feedback
CREATE POLICY "Users can view own feedback"
  ON training_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback"
  ON training_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback"
  ON training_feedback FOR DELETE USING (auth.uid() = user_id);

-- Training Rules: users can only access their own rules
CREATE POLICY "Users can view own rules"
  ON training_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules"
  ON training_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules"
  ON training_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules"
  ON training_rules FOR DELETE USING (auth.uid() = user_id);

-- =============================================================
-- Auto-create profile on user signup (trigger)
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- Storage bucket for survey images
-- Run this separately if needed, or create via Supabase Dashboard
-- =============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('survey-images', 'survey-images', true);

-- Storage RLS policies
-- CREATE POLICY "Users can upload own images" ON storage.objects
--   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'survey-images');
-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'survey-images');
-- CREATE POLICY "Users can delete own images" ON storage.objects
--   FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'survey-images');

-- =============================================================
-- 6. Issues (Bug & Feature Tracker)
-- =============================================================
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'bug',
  module TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own issues"
  ON issues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own issues"
  ON issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own issues"
  ON issues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own issues"
  ON issues FOR DELETE USING (auth.uid() = user_id);

