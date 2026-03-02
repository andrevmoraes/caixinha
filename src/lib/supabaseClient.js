import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from '../../supabase.config.js';

export const supabase = createClient(supabaseUrl, supabaseKey);
