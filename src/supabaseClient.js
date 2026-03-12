import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ishvyypilqfhquhiekhe.supabase.co/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHZ5eXBpbHFmaHF1aGlla2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjY1MjcsImV4cCI6MjA4ODg0MjUyN30.s93fcCO6ptn6901Nlvl1s09iOcFKOooPPIwh7viaHL8'

export const supabase = createClient(supabaseUrl, supabaseKey)