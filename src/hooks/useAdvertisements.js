import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useAdvertisements(position) {
  return useQuery({
    queryKey: ['ads', position],
    queryFn: async () => {
      let q = supabase.from('advertisements').select('*').eq('status', 'active');
      if (position) q = q.eq('position', position);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAllAds() {
  return useQuery({
    queryKey: ['ads', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('advertisements').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads'] }),
  });
}

export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from('advertisements').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads'] }),
  });
}

export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('advertisements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads'] }),
  });
}
