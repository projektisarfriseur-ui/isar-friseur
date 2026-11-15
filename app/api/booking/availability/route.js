import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { BookingError, loadSettings, loadCatalog, eligibleStaff, loadDay, buildItinerary, findSlots } from '../../../lib/booking/engine';
import { isValidDateStr } from '../../../lib/booking/time';
import { errorResponse } from '../../../lib/booking/http';

// GET /api/booking/availability?date=YYYY-MM-DD&serviceIds=1,2&staffId=3|any
// Returns bookable start times only; never other clients' data (CUS-07).
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceIds = (searchParams.get('serviceIds') || '').split(',').filter(Boolean).map(Number);
    const staffParam = searchParams.get('staffId') || 'any';
    if (!isValidDateStr(date)) throw new BookingError('invalid_input', 400, { field: 'date' });
    if (serviceIds.some(n => !Number.isInteger(n))) throw new BookingError('invalid_services');

    const db = pool();
    const [settings, catalog] = await Promise.all([loadSettings(db), loadCatalog(db)]);
    const itin = buildItinerary(serviceIds, catalog);
    let staff = await eligibleStaff(db, serviceIds);
    if (staffParam !== 'any') {
      staff = staff.filter(s => s.id === Number(staffParam));
      if (!staff.length) throw new BookingError('staff_not_eligible', 422);
    }
    const day = await loadDay(db, date, settings);
    const slots = findSlots(day, itin, settings, staff);

    return NextResponse.json({
      date,
      timezone: settings.timezone,
      durationMinutes: itin.visibleMinutes,
      slots: slots.map(s => s.time),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
