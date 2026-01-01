import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nryxovlmnmrabqlrciaf.supabase.co';
const supabaseKey = 'sb_publishable__K3VCde7RsySouo__2z_rw_mB2aQfTx';

export const supabase = createClient(supabaseUrl, supabaseKey);