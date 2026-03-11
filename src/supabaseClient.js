import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TUTAJ_WKLEISZ_LINK_OD_KUMPLA'
const supabaseKey = 'TUTAJ_WKLEISZ_KLUCZ_OD_KUMPLA'

export const supabase = createClient(supabaseUrl, supabaseKey)