/**
 * Cloudflare Worker — Contact Form Handler
 * Deploy as: /api/contact
 *
 * Uses MailChannels (free on Cloudflare Workers) to send email.
 * No API keys needed — MailChannels is natively integrated.
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

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

    const emailBody = `
New contact form submission — blamethe.net

Name:         ${name}
Email:        ${email}
Organization: ${org || '—'}
Type:         ${type || '—'}

Message:
${message}
    `.trim();

    const mailReq = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'chris@blamethe.net', name: 'Chris Anderson' }],
          reply_to: { email, name },
        }],
        from: { email: 'noreply@blamethe.net', name: 'blamethe.net contact form' },
        subject: `[blamethe.net] New inquiry from ${name}`,
        content: [{ type: 'text/plain', value: emailBody }],
      }),
    });

    if (mailReq.status === 202) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const errText = await mailReq.text();
    console.error('MailChannels error:', mailReq.status, errText);
    return new Response('Mail delivery failed', { status: 500 });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://blamethe.net',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
