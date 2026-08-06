import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cjxfvpkbfixjkppowhwg.supabase.co'
const supabaseAnonKey = 'sb_publishable_0IuI2B5FJ6DmPREfRCqjqG__stdi'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
