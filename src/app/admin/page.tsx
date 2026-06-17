// src/app/admin/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminServer } from '@/lib/supabase/admin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) redirect('/auth/sign-in');

  const isAdmin = await isAdminServer(user.id);
  if (!isAdmin) redirect('/');

  return (
    <>
      <AuthHeader />
      <AdminDashboard />
    </>
  );
}