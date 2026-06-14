-- ============================================================
-- KopMaza News Portal - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (synced with Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Authors
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  photo TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- News articles
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  short_description_color VARCHAR(20),
  content TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views INTEGER NOT NULL DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- News-Tags junction
CREATE TABLE IF NOT EXISTS public.news_tags (
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, tag_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscribers
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Advertisements
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image TEXT,
  url TEXT,
  position TEXT NOT NULL DEFAULT 'sidebar' CHECK (position IN ('header', 'sidebar', 'footer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news(status);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news(slug);
CREATE INDEX IF NOT EXISTS idx_news_category_id ON public.news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_views ON public.news(views DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON public.news(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_news_breaking ON public.news(is_breaking) WHERE is_breaking = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_news_id ON public.comments(news_id);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_news_fts ON public.news
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(short_description, '')));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment view count safely
CREATE OR REPLACE FUNCTION increment_views(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.news SET views = views + 1 WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PUBLIC reads: categories, authors, tags
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "authors_public_read" ON public.authors FOR SELECT USING (TRUE);
CREATE POLICY "tags_public_read" ON public.tags FOR SELECT USING (TRUE);
CREATE POLICY "news_tags_public_read" ON public.news_tags FOR SELECT USING (TRUE);

-- News: public can read published only
CREATE POLICY "news_public_read" ON public.news FOR SELECT
  USING (status = 'published' OR is_admin());

-- Comments: public can read approved comments
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT
  USING (status = 'approved' OR is_admin());

-- Comments: anyone can insert (pending)
CREATE POLICY "comments_public_insert" ON public.comments FOR INSERT
  WITH CHECK (status = 'pending');

-- Subscribers: public can insert
CREATE POLICY "subscribers_public_insert" ON public.subscribers FOR INSERT
  WITH CHECK (TRUE);

-- Advertisements: public can read active
CREATE POLICY "ads_public_read" ON public.advertisements FOR SELECT
  USING (status = 'active' OR is_admin());

-- Admin-only write policies
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (is_admin());
CREATE POLICY "authors_admin_all" ON public.authors FOR ALL USING (is_admin());
CREATE POLICY "tags_admin_all" ON public.tags FOR ALL USING (is_admin());
CREATE POLICY "news_admin_all" ON public.news FOR ALL USING (is_admin());
CREATE POLICY "news_tags_admin_all" ON public.news_tags FOR ALL USING (is_admin());
CREATE POLICY "comments_admin_all" ON public.comments FOR ALL USING (is_admin());
CREATE POLICY "subscribers_admin_read" ON public.subscribers FOR SELECT USING (is_admin());
CREATE POLICY "ads_admin_all" ON public.advertisements FOR ALL USING (is_admin());
CREATE POLICY "users_own_read" ON public.users FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (is_admin());

-- ============================================================
-- SEED DATA (optional – remove if not needed)
-- ============================================================

INSERT INTO public.categories (name, slug, description) VALUES
  ('Politics', 'politics', 'Political news and updates'),
  ('Business', 'business', 'Business and economy news'),
  ('Technology', 'technology', 'Technology and innovation'),
  ('Sports', 'sports', 'Sports news and results'),
  ('Entertainment', 'entertainment', 'Entertainment and lifestyle'),
  ('Health', 'health', 'Health and wellness news'),
  ('Education', 'education', 'Education and academic news')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET (run in Storage settings or via SQL)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', TRUE)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "news_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
-- CREATE POLICY "news_images_admin_upload" ON storage.objects FOR INSERT USING (bucket_id = 'news-images' AND is_admin());
