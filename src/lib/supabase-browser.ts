import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser (public) Supabase client — safe to use in Client Components
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
