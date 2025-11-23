-- AutoGen Database Schema
-- Project: AutoGen (ID: eqacvrjbalyiodhohexy)
-- Dark Automotive Luxury Social Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================
-- CARS TABLE (User's Garage)
-- ============================================
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb, -- Array of multiple image URLs
  specs JSONB DEFAULT '{}'::jsonb, -- {engine, horsepower, mods: []}
  ai_analysis JSONB, -- Raw AI response from Gemini
  visual_description TEXT, -- For image generation prompts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Policies for cars
CREATE POLICY "Users can view their own cars" 
  ON cars FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars" 
  ON cars FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars" 
  ON cars FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars" 
  ON cars FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PHOTOSHOOTS TABLE (Studio Creations)
-- ============================================
CREATE TABLE IF NOT EXISTS photoshoots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  environment TEXT, -- e.g., "Cyberpunk Tokyo", "Swiss Alps"
  image_url TEXT, -- Generated image URL
  video_url TEXT, -- Generated video URL (Veo)
  settings JSONB DEFAULT '{}'::jsonb, -- {size, aspectRatio, model}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photoshoots ENABLE ROW LEVEL SECURITY;

-- Policies for photoshoots
CREATE POLICY "Users can view their own photoshoots" 
  ON photoshoots FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photoshoots" 
  ON photoshoots FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photoshoots" 
  ON photoshoots FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- POSTS TABLE (Social Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  photoshoot_id UUID REFERENCES photoshoots(id) ON DELETE SET NULL,
  caption TEXT,
  media_url TEXT NOT NULL, -- Image or video URL
  media_type TEXT DEFAULT 'image', -- 'image' or 'video'
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert posts" 
  ON posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON posts FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can like posts" 
  ON likes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
  ON likes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update likes_count on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
DROP TRIGGER IF EXISTS trigger_update_likes_count ON likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these commands in Supabase Dashboard > Storage

-- Storage bucket for car photos (user uploads)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('garage', 'garage', true);

-- Storage bucket for AI-generated content
-- INSERT INTO storage.buckets (id, name, public) VALUES ('studio', 'studio', true);

-- Storage policies for 'garage' bucket
-- CREATE POLICY "Users can upload to their own folder" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'garage' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Anyone can view garage images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'garage');

-- CREATE POLICY "Users can update their own images" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'garage' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete their own images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'garage' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_photoshoots_user_id ON photoshoots(user_id);
CREATE INDEX IF NOT EXISTS idx_photoshoots_car_id ON photoshoots(car_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert test data
-- INSERT INTO profiles (id, username, display_name, bio) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'aymen', 'Aymen', 'AutoGen Creator');
