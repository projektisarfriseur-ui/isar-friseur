import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Isar Friseur <onboarding@resend.dev>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'burhan380@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'burhan380@gmail.com';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

const resend = apiKey ? new Resend(apiKey) : null;

async function send({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] Resend not configured, skipping send to', to);
    return { skipped: true };
  }
  return resend.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject, html });
}

const wrap = (inner) => `
<!doctype html><html><body style="margin:0;background:#020202;font-family:'Mulish',Arial,sans-serif;color:#fff;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;letter-spacing:0.12em;color:#fff;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:18px;">ISAR FRISEUR</div>
  <div style="padding:28px 0;line-height:1.7;font-size:15px;color:#fff;">${inner}</div>
  <div style="margin-top:28px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.12);font-size:12px;color:rgba(255,255,255,0.5);">
    Fraunhofer Straße 14, 80469 München<br>089 800 39 037
  </div>
</div></body></html>`;

// 'YYYY-MM-DD' -> 'DD.MM.YYYY'
const dmy = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v.split('-').reverse().join('.') : v);

const fmtSummary = (b, lang = 'de') => {
  const dateLabel = dmy(b.date);
  return `<table cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid rgba(255,255,255,0.15);width:100%;">
    <tr><td style="padding:10px 14px;color:rgba(255,255,255,0.6);width:120px;">${lang==='de'?'Datum':'Date'}</td><td style="padding:10px 14px;">${dateLabel}</td></tr>
    <tr><td style="padding:10px 14px;color:rgba(255,255,255,0.6);">${lang==='de'?'Uhrzeit':'Time'}</td><td style="padding:10px 14px;">${b.start_time} - ${b.end_time}</td></tr>
    <tr><td style="padding:10px 14px;color:rgba(255,255,255,0.6);">${lang==='de'?'Dauer':'Duration'}</td><td style="padding:10px 14px;">${b.duration_min} min</td></tr>
    <tr><td style="padding:10px 14px;color:rgba(255,255,255,0.6);">${lang==='de'?'Preis (Richtwert)':'Price (estimate)'}</td><td style="padding:10px 14px;">${b.price_estimate}</td></tr>
  </table>`;
};

export async function sendBookingReceived(b) {
  if (!b.email) return;
  const isDe = b.lang === 'de';
  const confirmUrl = `${SITE}/api/bookings/confirm?token=${b.confirm_token}`;
  const cancelUrl = `${SITE}/api/bookings/cancel?token=${b.cancel_token}`;

  const inner = isDe
    ? `<p>Hallo ${b.first_name},</p>
       <p>danke für deine Buchungsanfrage bei <strong>Isar Friseur</strong>.</p>
       ${fmtSummary(b, 'de')}
       <p>Bitte bestätige deinen Termin mit einem Klick:</p>
       <p><a href="${confirmUrl}" style="display:inline-block;background:#b85933;color:#fff;padding:14px 28px;text-decoration:none;letter-spacing:0.14em;font-weight:600;font-size:13px;">TERMIN BESTÄTIGEN</a></p>
       <p style="font-size:13px;color:rgba(255,255,255,0.6);">Falls du nicht kommen kannst, kannst du <a href="${cancelUrl}" style="color:#b85933;">hier stornieren</a>.</p>`
    : `<p>Hi ${b.first_name},</p>
       <p>thanks for your booking request at <strong>Isar Friseur</strong>.</p>
       ${fmtSummary(b, 'en')}
       <p>Please confirm your appointment with a click:</p>
       <p><a href="${confirmUrl}" style="display:inline-block;background:#b85933;color:#fff;padding:14px 28px;text-decoration:none;letter-spacing:0.14em;font-weight:600;font-size:13px;">CONFIRM APPOINTMENT</a></p>
       <p style="font-size:13px;color:rgba(255,255,255,0.6);">If you cannot make it, you can <a href="${cancelUrl}" style="color:#b85933;">cancel here</a>.</p>`;

  await send({ to: b.email, subject: isDe ? 'Bitte Termin bestätigen | Isar Friseur' : 'Please confirm your appointment | Isar Friseur', html: wrap(inner) });
  await send({ to: ADMIN_EMAIL, subject: `Neue Anfrage: ${b.first_name} ${b.last_name}, ${dmy(b.date)} ${b.start_time}`, html: wrap(`<p>Neue Buchungsanfrage über die Website.</p>${fmtSummary(b, 'de')}<p>${b.first_name} ${b.last_name}<br>${b.phone || ''}<br>${b.email || ''}</p><p>${b.message || ''}</p>`) });
}

export async function sendBookingConfirmed(b) {
  if (!b.email) return;
  const isDe = b.lang === 'de';
  const cancelUrl = `${SITE}/api/bookings/cancel?token=${b.cancel_token}`;
  const inner = isDe
    ? `<p>Hallo ${b.first_name},</p><p>dein Termin ist bestätigt. Wir freuen uns!</p>${fmtSummary(b, 'de')}<p style="font-size:13px;color:rgba(255,255,255,0.6);"><a href="${cancelUrl}" style="color:#b85933;">Termin stornieren</a></p>`
    : `<p>Hi ${b.first_name},</p><p>your appointment is confirmed. See you soon!</p>${fmtSummary(b, 'en')}<p style="font-size:13px;color:rgba(255,255,255,0.6);"><a href="${cancelUrl}" style="color:#b85933;">Cancel appointment</a></p>`;
  await send({ to: b.email, subject: isDe ? 'Termin bestätigt | Isar Friseur' : 'Appointment confirmed | Isar Friseur', html: wrap(inner) });
}

export async function sendReminder24h(b, policyDe, policyEn) {
  if (!b.email) return;
  const isDe = b.lang === 'de';
  const cancelUrl = `${SITE}/api/bookings/cancel?token=${b.cancel_token}`;
  const policy = isDe ? policyDe : policyEn;
  const inner = isDe
    ? `<p>Hallo ${b.first_name},</p><p>kurze Erinnerung: wir sehen uns morgen.</p>${fmtSummary(b, 'de')}<p style="background:rgba(184,89,51,0.12);padding:14px;border-left:3px solid #b85933;font-size:13px;line-height:1.6;">${policy}</p><p><a href="${cancelUrl}" style="color:#b85933;">Termin stornieren</a></p>`
    : `<p>Hi ${b.first_name},</p><p>quick reminder: see you tomorrow.</p>${fmtSummary(b, 'en')}<p style="background:rgba(184,89,51,0.12);padding:14px;border-left:3px solid #b85933;font-size:13px;line-height:1.6;">${policy}</p><p><a href="${cancelUrl}" style="color:#b85933;">Cancel appointment</a></p>`;
  await send({ to: b.email, subject: isDe ? 'Erinnerung: dein Termin morgen | Isar Friseur' : 'Reminder: your appointment tomorrow | Isar Friseur', html: wrap(inner) });
}

export async function sendReminder1h(b) {
  if (!b.email) return;
  const isDe = b.lang === 'de';
  const inner = isDe
    ? `<p>Hallo ${b.first_name},</p><p>wir sehen uns in einer Stunde.</p>${fmtSummary(b, 'de')}<p>Fraunhofer Straße 14, 80469 München</p>`
    : `<p>Hi ${b.first_name},</p><p>see you in an hour.</p>${fmtSummary(b, 'en')}<p>Fraunhofer Straße 14, 80469 Munich</p>`;
  await send({ to: b.email, subject: isDe ? 'In einer Stunde | Isar Friseur' : 'In one hour | Isar Friseur', html: wrap(inner) });
}

export async function sendCancelled(b) {
  if (!b.email) return;
  const isDe = b.lang === 'de';
  const inner = isDe
    ? `<p>Hallo ${b.first_name},</p><p>dein Termin wurde storniert.</p>${fmtSummary(b, 'de')}<p>Du kannst jederzeit einen neuen Termin buchen: <a href="${SITE}/booking" style="color:#b85933;">${SITE}/booking</a></p>`
    : `<p>Hi ${b.first_name},</p><p>your appointment has been cancelled.</p>${fmtSummary(b, 'en')}<p>You can book a new one anytime: <a href="${SITE}/booking" style="color:#b85933;">${SITE}/booking</a></p>`;
  await send({ to: b.email, subject: isDe ? 'Termin storniert | Isar Friseur' : 'Appointment cancelled | Isar Friseur', html: wrap(inner) });
  await send({ to: ADMIN_EMAIL, subject: `Storno: ${b.first_name} ${b.last_name}, ${dmy(b.date)} ${b.start_time}`, html: wrap(`<p>Buchung storniert.</p>${fmtSummary(b, 'de')}`) });
}
