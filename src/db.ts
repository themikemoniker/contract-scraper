import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    // We allow running without creds for testing purposes (it will just log errors or dummy mode)
    // But strictly, we should warn.
    console.warn('Missing SUPABASE_URL or SUPABASE_KEY. DB operations will fail.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
