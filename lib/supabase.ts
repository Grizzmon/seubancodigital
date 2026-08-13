import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cjxfvpkbfixjkppowhwg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeGZ2cGtiZml4amtwcG93aHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTg3NzMsImV4cCI6MjA5Mzg3NDc3M30.8Z9WJ_HPY2MS_LKFol2bZ2MAYzlqCpR9E0oV4oOV5Ew";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
