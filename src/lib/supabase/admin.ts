// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local')
}

export const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Проверка, является ли пользователь админом (для серверных компонентов)
export async function isAdminServer(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return data?.role === 'admin';
}