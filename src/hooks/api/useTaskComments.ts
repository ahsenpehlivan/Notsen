import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TaskComment } from '@/types/board';

export function useTaskComments(taskId: string) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['task_comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userEmail: row.author_email as string,
        text: row.content as string,
        createdAt: row.created_at as string,
      })) as TaskComment[];
    },
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase.rpc('add_task_comment_v1', {
        p_task_id: taskId,
        p_content: content,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_comments', taskId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.rpc('delete_task_comment_v1', {
        p_comment_id: commentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_comments', taskId] });
    },
  });

  return {
    comments,
    isLoading,
    error,
    addComment,
    deleteComment,
  };
}
