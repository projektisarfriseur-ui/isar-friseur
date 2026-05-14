import { NextResponse } from 'next/server';
import { supa, supaConfigured } from '../../lib/supabase';

const FALLBACK = [
  { id: 1, group_key: 'women', name_de: 'Waschen, Schneiden, Föhnen', name_en: 'Wash, cut, blow-dry', price_from: 48, duration_min: 60, is_fixed_price: false, active: true, sort_order: 1 },
  { id: 2, group_key: 'women', name_de: 'Trockenhaarschnitt', name_en: 'Dry cut', price_from: 38, duration_min: 40, is_fixed_price: false, active: true, sort_order: 2 },
  { id: 3, group_key: 'women', name_de: 'Pony nachschneiden', name_en: 'Fringe trim', price_from: 10, duration_min: 15, is_fixed_price: true, active: true, sort_order: 3 },
  { id: 4, group_key: 'women', name_de: 'Hochsteckfrisur', name_en: 'Updo', price_from: 65, duration_min: 60, is_fixed_price: false, active: true, sort_order: 4 },
  { id: 5, group_key: 'men', name_de: 'Waschen, Schneiden, Föhnen', name_en: 'Wash, cut, blow-dry', price_from: 32, duration_min: 40, is_fixed_price: false, active: true, sort_order: 1 },
  { id: 6, group_key: 'men', name_de: 'Trockenhaarschnitt', name_en: 'Dry cut', price_from: 26, duration_min: 30, is_fixed_price: false, active: true, sort_order: 2 },
  { id: 7, group_key: 'men', name_de: 'Bart konturieren', name_en: 'Beard contouring', price_from: 12, duration_min: 15, is_fixed_price: true, active: true, sort_order: 3 },
  { id: 8, group_key: 'men', name_de: 'Maschinenschnitt', name_en: 'Clipper cut', price_from: 20, duration_min: 20, is_fixed_price: true, active: true, sort_order: 4 },
  { id: 9, group_key: 'color', name_de: 'Ansatz färben', name_en: 'Root colour', price_from: 55, duration_min: 75, is_fixed_price: false, active: true, sort_order: 1 },
  { id: 10, group_key: 'color', name_de: 'Komplettfärbung', name_en: 'Full colour', price_from: 75, duration_min: 90, is_fixed_price: false, active: true, sort_order: 2 },
  { id: 11, group_key: 'color', name_de: 'Balayage', name_en: 'Balayage', price_from: 140, duration_min: 150, is_fixed_price: false, active: true, sort_order: 3 },
  { id: 12, group_key: 'color', name_de: 'Foliensträhnen', name_en: 'Foil highlights', price_from: 90, duration_min: 120, is_fixed_price: false, active: true, sort_order: 4 },
  { id: 13, group_key: 'color', name_de: 'Tönung', name_en: 'Toning', price_from: 45, duration_min: 60, is_fixed_price: false, active: true, sort_order: 5 },
  { id: 14, group_key: 'care', name_de: 'Olaplex Behandlung', name_en: 'Olaplex treatment', price_from: 25, duration_min: 30, is_fixed_price: false, active: true, sort_order: 1 },
  { id: 15, group_key: 'care', name_de: 'Keratin Kur', name_en: 'Keratin treatment', price_from: 35, duration_min: 45, is_fixed_price: false, active: true, sort_order: 2 },
  { id: 16, group_key: 'care', name_de: 'Kopfhautmassage', name_en: 'Scalp massage', price_from: 15, duration_min: 15, is_fixed_price: true, active: true, sort_order: 3 },
];

export async function GET() {
  if (!supaConfigured()) {
    return NextResponse.json({ services: FALLBACK, fallback: true });
  }
  const { data, error } = await supa()
    .from('services').select('*').eq('active', true).order('group_key').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}
