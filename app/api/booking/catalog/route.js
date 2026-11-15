import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { loadCatalog } from '../../../lib/booking/engine';
import { errorResponse } from '../../../lib/booking/http';

// Public catalogue for the booking wizard. Shape stays compatible with the
// wizard's original fields (group_key, price_from, is_fixed_price, duration_min).
export async function GET() {
  try {
    const db = pool();
    const catalog = await loadCatalog(db);
    const { rows: staff } = await db.query(`
      select id, display_name, slug, title_de, title_en, photo_url, languages
        from booking.staff where bookable and archived_at is null order by sort_order, id`);
    return NextResponse.json({
      services: catalog.list.map(s => ({
        id: s.id,
        group_key: s.category_key,
        name_de: s.name_de,
        name_en: s.name_en,
        price_mode: s.price_mode,
        price_minor: s.price_minor,
        price_from: s.price_minor != null ? s.price_minor / 100 : null,
        is_fixed_price: s.price_mode === 'exact',
        currency: s.currency,
        duration_min: s.visible_minutes,
      })),
      stylists: staff.map(s => ({
        id: Number(s.id),
        name: s.display_name,
        slug: s.slug,
        role_key: s.title_de,
        photo_url: s.photo_url,
        languages: s.languages,
      })),
    }, { headers: { 'cache-control': 'public, max-age=60' } });
  } catch (err) {
    return errorResponse(err);
  }
}
