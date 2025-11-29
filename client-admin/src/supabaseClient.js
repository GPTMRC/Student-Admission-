import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://avnmpvjocmnearcgrduq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bm1wdmpvY21uZWFyY2dyZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzQ2OTAsImV4cCI6MjA3NTQxMDY5MH0.i7NNK9WB_mzFj84Rjk5f5hq-i6g_-lYPeLjCHJiiw2Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
