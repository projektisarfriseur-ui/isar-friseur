import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../lib/supabase';

const FALLBACK = [
  { id: 1, name: 'Gülay',  role_key: 'Friseurmeisterin', photo_url: '/team/gulay.webp', languages: ['DE','TR','EN'],      sort_order: 1, active: true },
  { id: 2, name: 'Paula',  role_key: 'Friseurmeisterin', photo_url: '/team/paula.webp', languages: ['DE','EN'],           sort_order: 2, active: true },
  { id: 3, name: 'Karam',  role_key: 'Friseur',          photo_url: '/team/karam.webp', languages: ['DE','AR','EN'],      sort_order: 3, active: true },
  { id: 4, name: 'Gjent',  role_key: 'Friseur',          photo_url: '/team/gjent.webp', languages: ['DE','SQ','EN'],      sort_order: 4, active: true },
  { id: 5, name: 'Haji',   role_key: 'Friseur',          photo_url: '/team/haji.webp',  languages: ['DE','AR','EN'],      sort_order: 5, active: true },
  { id: 6, name: 'Khalid', role_key: 'Friseur',          photo_url: null,              languages: ['DE','AR'],           sort_order: 6, active: true },
  { id: 7, name: 'Sascha', role_key: 'Team',             photo_url: null,              languages: ['DE','RU','EN'],      sort_order: 7, active: true },
];

export async function GET() {
  if (!supaConfigured()) return NextResponse.json({ stylists: FALLBACK, fallback: true });
  const { data, error } = await supa()
    .from('stylists').select('*').eq('active', true).order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stylists: data });
}
