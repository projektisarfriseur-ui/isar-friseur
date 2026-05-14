import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;
if (url && key) {
  client = createClient(url, key, { auth: { persistSession: false } });
}

export function supa() {
  if (!client) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return client;
}

export function supaConfigured() {
  return client !== null;
}
