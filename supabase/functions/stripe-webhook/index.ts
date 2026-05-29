import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =====================================================================
// Stripe Webhook Handler — Smart Clinic Pro
// Verifies Stripe signature and updates appointment on payment success
// =====================================================================

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature    = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Read raw body (must be raw string for signature verification)
  const body = await req.text();

  // ── 1. Verify Stripe signature ────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = await verifyStripeSignature(body, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // ── 2. Handle events ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data as Record<string, Record<string, string>>;
    const obj     = session.object ?? {};

    const appointmentId    = obj['metadata.appointment_id'] ?? (obj.metadata as unknown as Record<string,string>)?.appointment_id;
    const stripeSessionId  = obj.id;
    const paymentIntent    = obj.payment_intent;
    const customerEmail    = obj.customer_email ?? obj.customer_details?.email ?? '';

    if (!appointmentId) {
      console.warn('[webhook] checkout.session.completed — no appointment_id in metadata');
      return new Response('OK', { status: 200 });
    }

    // ── 3. Update appointment in DB using service role ────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase
      .from('appointments')
      .update({
        status:               'completed',
        stripe_session_id:    stripeSessionId,
        stripe_payment_intent: paymentIntent,
        paid_at:              new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (error) {
      console.error('[webhook] DB update failed:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`[webhook] ✅ Appointment ${appointmentId} marked as completed (session: ${stripeSessionId})`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});


// =====================================================================
// verifyStripeSignature
// Uses Web Crypto API (available in Deno/Edge runtime)
// Implements constant-time comparison to prevent timing attacks
// Validates timestamp to prevent replay attacks (5-minute window)
// =====================================================================
async function verifyStripeSignature(
  payload:   string,
  signature: string,
  secret:    string
): Promise<Record<string, unknown>> {
  // Parse header: t=<timestamp>,v1=<sig>
  const parts     = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2) ?? '';
  const v1        = parts.find(p => p.startsWith('v1='))?.slice(3) ?? '';

  if (!timestamp || !v1) {
    throw new Error('Malformed stripe-signature header');
  }

  // ── Timestamp check (replay attack prevention) ────────────────────
  const TOLERANCE_SECONDS = 300; // 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > TOLERANCE_SECONDS) {
    throw new Error(`Timestamp out of tolerance: ${timestamp}`);
  }

  // ── HMAC-SHA256 ───────────────────────────────────────────────────
  const signedPayload = `${timestamp}.${payload}`;
  const encoder       = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const computed  = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // ── Constant-time comparison (timing attack prevention) ───────────
  if (computed.length !== v1.length) {
    throw new Error('Signature length mismatch');
  }
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  if (diff !== 0) {
    throw new Error('Signature mismatch');
  }

  return JSON.parse(payload) as Record<string, unknown>;
}
