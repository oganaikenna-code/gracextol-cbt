// ================================================
// GRACEXTOL CBT
// SHARED SUPABASE CONNECTION
// ================================================

const SUPABASE_URL =
    "https://hbctswhvezdshlyeuzjx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_gigKt7WIMDgo_OIE-3xVsA_46f7wvn4";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("Gracextol Supabase connected.");