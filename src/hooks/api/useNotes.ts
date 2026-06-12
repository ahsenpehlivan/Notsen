import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/lib/toast';
import type { Note } from '@/types/board';

// A regex to extract hashtags from content.
// E.g., "Makarna tarifi #yemek #mutfak" => ['#yemek', '#mutfak']
export const extractTags = (content: string): string[] => {
  const matches = content.match(/#[a-zA-ZğüşöçİĞÜŞÖÇ0-9_]+/g);
  return matches ? Array.from(new Set(matches)) : [];
};

export function useNotes() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: queryKeys.notes(userId),
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Note[];
    },
    enabled: !!userId,
  });
}

export function useNoteMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error('Oturum açılmadı');
      const tags = extractTags(content);
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: userId,
          content,
          tags,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data as Note;
    },
    onMutate: async (content) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: queryKeys.notes(userId) });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes(userId));

      const optimisticNote: Note = {
        id: `optimistic-${Date.now()}`,
        user_id: userId,
        content,
        tags: extractTags(content),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Note[]>(queryKeys.notes(userId), (old) => {
        return old ? [optimisticNote, ...old] : [optimisticNote];
      });

      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes(userId), context.previousNotes);
      }
      toast.error('Not eklenemedi: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes(userId) });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const tags = extractTags(content);
      const { data, error } = await supabase
        .from('notes')
        .update({
          content,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Note;
    },
    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes(userId) });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes(userId));

      queryClient.setQueryData<Note[]>(queryKeys.notes(userId), (old) => {
        return (old || []).map(note => 
          note.id === id 
            ? { ...note, content, tags: extractTags(content) } 
            : note
        );
      });

      return { previousNotes };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes(userId), context.previousNotes);
      }
      toast.error('Not güncellenemedi: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes(userId) });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes(userId) });
      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes(userId));

      queryClient.setQueryData<Note[]>(queryKeys.notes(userId), (old) => {
        return (old || []).filter(note => note.id !== id);
      });

      return { previousNotes };
    },
    onError: (err, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes(userId), context.previousNotes);
      }
      toast.error('Not silinemedi: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes(userId) });
    },
  });

  return { addNote, updateNote, deleteNote };
}
