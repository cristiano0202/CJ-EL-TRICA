const SUPABASE_URL = "https://srsqixhumycmxbgddtsu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TSf7ShI9RWDu-XO0J1Sh2Q_6NqoAHXu";

const cjSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.cjSupabase = cjSupabase;
