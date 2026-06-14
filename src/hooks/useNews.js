import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const NEWS_SELECT = `
  id, title, slug, short_description, featured_image,
  is_featured, is_breaking, status, views, created_at, updated_at,
  categories(id, name, slug),
  authors(id, name, photo)
`;

const NEWS_FULL_SELECT = `
  id, title, slug, short_description, content, featured_image,
  is_featured, is_breaking, status, views, meta_title, meta_description,
  created_at, updated_at,
  categories(id, name, slug),
  authors(id, name, photo, bio)
`;

// Fetch news list (published only)
export function useNewsList({ categoryId, limit = 10, page = 1 } = {}) {
  return useQuery({
    queryKey: ['news', 'list', categoryId, limit, page],
    queryFn: async () => {
      let q = supabase
        .from('news')
        .select(NEWS_SELECT, { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (categoryId) q = q.eq('category_id', categoryId);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data, count };
    },
  });
}

// Fetch featured news
export function useFeaturedNews() {
  return useQuery({
    queryKey: ['news', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_SELECT)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });
}

// Fetch breaking news
export function useBreakingNews() {
  return useQuery({
    queryKey: ['news', 'breaking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('id, title, slug')
        .eq('status', 'published')
        .eq('is_breaking', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Fetch news by category slug
export function useNewsByCategory(categorySlug, { limit = 9, page = 1 } = {}) {
  return useQuery({
    queryKey: ['news', 'category', categorySlug, limit, page],
    queryFn: async () => {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (!cat) return { data: [], count: 0 };

      const { data, error, count } = await supabase
        .from('news')
        .select(NEWS_SELECT, { count: 'exact' })
        .eq('status', 'published')
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;
      return { data, count };
    },
    enabled: !!categorySlug,
  });
}

// UUID pattern for ID-based lookups
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fetch single news by slug (or ID for articles with empty slugs)
export function useNewsDetail(slug) {
  return useQuery({
    queryKey: ['news', 'detail', slug],
    queryFn: async () => {
      const isId = UUID_RE.test(slug);
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_FULL_SELECT)
        .eq(isId ? 'id' : 'slug', slug)
        .single();
      if (error) throw error;

      // Increment view count (fire and forget — don't let errors bubble up)
      supabase.rpc('increment_views', { news_id: data.id }).then(() => {}, () => {});

      return data;
    },
    enabled: !!slug,
  });
}

// Related news
export function useRelatedNews(categoryId, currentId) {
  return useQuery({
    queryKey: ['news', 'related', categoryId, currentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_SELECT)
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .neq('id', currentId)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId && !!currentId,
  });
}

// Latest news for sidebar
export function useLatestNews(limit = 5) {
  return useQuery({
    queryKey: ['news', 'latest', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_SELECT)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

// Most viewed (popular)
export function usePopularNews(limit = 5) {
  return useQuery({
    queryKey: ['news', 'popular', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_SELECT)
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

// Search news
export function useSearchNews(query) {
  return useQuery({
    queryKey: ['news', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(NEWS_SELECT)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,short_description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: query.trim().length > 2,
  });
}

// ---- Admin mutations ----

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('news').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news'] }),
  });
}

export function useUpdateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from('news').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news'] }),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['news'] }),
  });
}

// Admin: all news (including unpublished)
export function useAdminNewsList({ limit = 20, page = 1 } = {}) {
  return useQuery({
    queryKey: ['admin', 'news', limit, page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('news')
        .select(`${NEWS_SELECT}, status`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (error) throw error;
      return { data, count };
    },
  });
}
