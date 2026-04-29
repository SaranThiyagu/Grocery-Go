import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      redirect('/admin');
    } else {
      redirect('/login');
    }
  } catch (error: any) {
    // Re-throw Next.js redirect errors (they use throw internally)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // If Supabase fails, redirect to login
    redirect('/login');
  }
}