/**
 * Cloudflare Pages Function — Contact Form Handler
 * Route: /api/contact
 *
 * Requires env var: RESEND_API_KEY
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { name, email, org, type, message } = body;

  if (!name || !email || !message) {
    return new Response('Missing required fields', { status: 400 });
  }

  const emailBody = `New contact form submission — blamethe.net

Name:         ${name}
Email:        ${email}
Organization: ${org || '—'}
Type:         ${type || '—'}

Message:
${message}`.trim();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'blamethe.net contact form <noreply@blamethe.net>',
      to: ['contact@blamethe.net'],
      reply_to: `${name} <${email}>`,
      subject: `[blamethe.net] New inquiry from ${name}`,
      text: emailBody,
    }),
  });

  if (res.ok) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const err = await res.text();
  console.error('Resend error:', res.status, err);
  return new Response('Mail delivery failed', { status: 500 });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://blamethe.net',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
