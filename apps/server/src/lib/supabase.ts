import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // needs service key for inserting users

export const supabase = createClient(supabaseUrl, supabaseKey);
