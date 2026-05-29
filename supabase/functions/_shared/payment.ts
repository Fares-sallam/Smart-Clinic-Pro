import { corsHeaders, jsonResponse } from './cors.ts';

// =====================================================================
// Payment Handler — Smart Clinic Pro
// Creates a Stripe Checkout session server-side.
// Amount is NEVER taken from the client — always defined here.
// =====================================================================

const CONSULTATION_FEE_CENTS = 1000; // $10.00 — change here only
const ALLOWED_ORIGINS = [
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'https://smart-clinic-pro.vercel.app', // add your production URL
];

export async function handlePaymentRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // ── 1. Parse & validate request body ─────────────────────────────
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { appointmentId, patientEmail, patientName, payMethod, origin } = body;

  if (!appointmentId || typeof appointmentId !== 'string') {
    return jsonResponse({ error: 'appointmentId is required' }, 400);
  }
  if (!patientEmail || typeof patientEmail !== 'string' || !patientEmail.includes('@')) {
    return jsonResponse({ error: 'Valid patientEmail is required' }, 400);
  }

  // ── 2. Only accept card payments ──────────────────────────────────
  if (payMethod === 'cash') {
    return jsonResponse({ error: 'Cash payments are handled at the clinic' }, 400);
  }

  // ── 3. Validate & sanitize origin ────────────────────────────────
  const safeOrigin = (typeof origin === 'string' && /^https?:\/\/[a-zA-Z0-9._:/-]+$/.test(origin))
    ? origin
    : ALLOWED_ORIGINS[0];

  // ── 4. Get Stripe key ─────────────────────────────────────────────
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    ?? '';
  if (!stripeKey || !stripeKey.startsWith('sk_')) {
    console.error('[payment] STRIPE_SECRET_KEY not configured or invalid');
    return jsonResponse({ error: 'Payment service not configured' }, 500);
  }

  // ── 5. Build Stripe Checkout session ─────────────────────────────
  const shortId    = String(appointmentId).slice(0, 8).toUpperCase();
  const safeName   = String(patientName ?? '').slice(0, 100).replace(/[<>"]/g, '');
  const safeEmail  = String(patientEmail).toLowerCase().trim();

  const sessionBody = new URLSearchParams({
    mode:                                             'payment',
    'payment_method_types[]':                         'card',
    'line_items[0][price_data][currency]':            'usd',
    'line_items[0][price_data][product_data][name]':  'Smart Clinic Pro — Consultation Fee',
    'line_items[0][price_data][product_data][description]':
      `Appointment #${shortId}`,
    'line_items[0][price_data][unit_amount]':         String(CONSULTATION_FEE_CENTS),
    'line_items[0][quantity]':                        '1',
    customer_email:                                   safeEmail,
    'metadata[appointment_id]':                       appointmentId,
    'metadata[patient_name]':                         safeName,
    'metadata[payment_method]':                       payMethod ?? 'card',
    // Stripe redirects here after payment
    success_url: `${safeOrigin}?payment=success&appt=${encodeURIComponent(appointmentId)}`,
    cancel_url:  `${safeOrigin}?payment=cancelled`,
    // Expire session after 30 minutes
    expires_at: String(Math.floor(Date.now() / 1000) + 1800),
  });

  // ── 6. Call Stripe API ────────────────────────────────────────────
  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        Authorization:   `Bearer ${stripeKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-04-10',
      },
      body: sessionBody.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[payment] Stripe API error:', JSON.stringify(session.error));
      return jsonResponse(
        { error: `Payment error: ${session.error?.message ?? 'Unknown Stripe error'}` },
        502
      );
    }

    // Return only what the client needs (never expose full session)
    return jsonResponse({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[payment] Fetch error:', err);
    return jsonResponse({ error: 'Failed to connect to payment service' }, 502);
  }
}
