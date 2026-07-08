-- TASLAK: Kullanıcı Hesabı Silme RPC (Production'da henüz ÇALIŞTIRMAYIN)
-- Bu fonksiyon, auth.users tablosuna doğrudan müdahale etmez; Supabase'in supabase_admin 
-- yetkisine veya Edge Function aracılığıyla admin API'sine ihtiyaç duyar.
-- Taslak olarak PostgreSQL üzerinden `auth.users` silme yaklaşımı (RLS atlanarak veya Postgres fonksiyonuyla):

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı oturumu bulunamadı.';
  END IF;

  -- 1. Kullanıcının tek sahibi olduğu panoların (boards) silinmesi
  -- CASCADE sayesinde board silindiğinde altındaki column, task ve notlar da silinir.
  DELETE FROM public.boards 
  WHERE user_id = v_user_id;

  -- 2. Storage dosyalarının silinmesi (örnek storage API tetikleyicisi / veya webhook)
  -- NOT: Supabase SQL'den Storage dosyalarını doğrudan silemez. Bu işlem için bir Edge Function
  -- veya trigger/webhook yazılmalıdır. 
  
  -- 3. Board member kayıtlarının silinmesi (CASCADE kurulu ise otomatik silinecektir, 
  -- değilse manuel temizlik yapılır).
  DELETE FROM public.board_members
  WHERE user_id = v_user_id;

  -- 4. Activity Logs anonimleştirme (Silinen kullanıcının kayıtları null yapılarak veya silinerek)
  -- Eğer loglar önemli değilse doğrudan DELETE edilebilir.
  UPDATE public.activity_logs
  SET user_id = NULL, details = jsonb_set(details, '{deleted_user}', 'true')
  WHERE user_id = v_user_id;

  -- 5. Kullanıcının auth.users'dan silinmesi (Admin yetkisi gerekir)
  -- PostgreSQL içinden auth.users silinebilir (Supabase'de Postgres postgres rolüne sahiptir)
  DELETE FROM auth.users 
  WHERE id = v_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
