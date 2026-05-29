import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const STATUS_ACTIONS = new Set(['approved', 'postponed', 'cancelled', 'completed']);

type Appointment = {
  id: string;
  patient_name?: string;
  patient_email?: string;
  doctor_name?: string;
  specialty?: string;
  preferred_date?: string;
  status?: string;
};

function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    new_booking: 'new booking',
    approved: 'approved',
    postponed: 'postponed',
    cancelled: 'cancelled',
    completed: 'completed',
  };
  return labels[action] || action;
}

function appointmentDate(appt: Appointment) {
  if (!appt.preferred_date) return 'Date to be confirmed';
  return new Date(appt.preferred_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function htmlEscape(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendEmail(to: string | undefined, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('NOTIFICATION_FROM') || 'Smart Clinic Pro <notifications@smartclinicpro.com>';

  if (!resendKey || !to) {
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Email provider error:', text);
    return false;
  }

  return true;
}

async function findDoctorEmail(supabase: ReturnType<typeof createClient>, doctorName?: string) {
  if (!doctorName) return undefined;

  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('email')
    .eq('display_name', doctorName)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.warn('Doctor lookup failed:', error.message);
    return undefined;
  }

  return data?.email;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, action } = await req.json();

    if (!appointmentId || !action) {
      return jsonResponse({ error: 'appointmentId and action are required' }, 400);
    }

    if (action !== 'new_booking' && !STATUS_ACTIONS.has(action)) {
      return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
    }

    const supabase = getServiceClient();
    let appointment: Appointment | null = null;

    if (STATUS_ACTIONS.has(action)) {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: action })
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (error) throw error;
      appointment = data;
    } else {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      appointment = data;
    }

    if (!appointment) {
      return jsonResponse({ error: 'Appointment not found' }, 404);
    }

    const dateLabel = appointmentDate(appointment);
    const subject = action === 'new_booking'
      ? `New appointment request: ${appointment.patient_name || 'Patient'}`
      : `Your Smart Clinic Pro appointment was ${actionLabel(action)}`;
    const body = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#0e87a0">Smart Clinic Pro</h2>
        <p>Appointment <strong>${actionLabel(action)}</strong>.</p>
        <p>
          <strong>Patient:</strong> ${htmlEscape(appointment.patient_name || 'Patient')}<br>
          <strong>Doctor:</strong> ${htmlEscape(appointment.doctor_name || 'To be assigned')}<br>
          <strong>Specialty:</strong> ${htmlEscape(appointment.specialty || 'General')}<br>
          <strong>Date:</strong> ${dateLabel}
        </p>
      </div>
    `;

    const recipient = action === 'new_booking'
      ? await findDoctorEmail(supabase, appointment.doctor_name) || Deno.env.get('CLINIC_ADMIN_EMAIL')
      : appointment.patient_email;
    const emailSent = await sendEmail(recipient, subject, body);

    return jsonResponse({
      ok: true,
      appointmentId,
      action,
      status: appointment.status || 'pending',
      emailSent,
    });
  } catch (err) {
    console.error('notify-appointment error:', err);
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
