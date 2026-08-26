// Triggered by Netlify's Outgoing Webhook notification whenever the
// "contact" form gets a new submission. Sends a custom-styled HTML email
// via Resend (https://resend.com) instead of Netlify's plain default one.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Netlify's webhook payload nests the actual form fields under payload.data
  const data = payload.data || {};
  const name = (data.name || 'Someone').toString();
  const email = (data.email || 'no email given').toString();
  const message = (data.message || '').toString();
  const submittedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `
  <div style="background:#0B1120;padding:32px;font-family:'Courier New',monospace;">
    <div style="max-width:520px;margin:0 auto;background:#141B2E;border:1px solid #232c42;border-radius:14px;overflow:hidden;">
      <div style="padding:14px 20px;background:#101728;border-bottom:1px solid #232c42;color:#5B6478;font-size:12px;">
        ● ● ●&nbsp;&nbsp;portfolio-contact.log
      </div>
      <div style="padding:28px 26px;color:#E7ECF7;">
        <p style="margin:0 0 4px;color:#22D3EE;font-size:12px;">// new submission</p>
        <h2 style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:20px;color:#F5A623;">
          New message from ${escapeHtml(name)}
        </h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:6px 0;color:#5B6478;font-size:12px;width:80px;">name</td>
            <td style="padding:6px 0;color:#E7ECF7;font-size:13px;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#5B6478;font-size:12px;">email</td>
            <td style="padding:6px 0;color:#E7ECF7;font-size:13px;">
              <a href="mailto:${escapeHtml(email)}" style="color:#22D3EE;text-decoration:none;">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#5B6478;font-size:12px;">sent</td>
            <td style="padding:6px 0;color:#E7ECF7;font-size:13px;">${escapeHtml(submittedAt)}</td>
          </tr>
        </table>
        <div style="background:#101728;border:1px solid #232c42;border-radius:10px;padding:16px 18px;">
          <p style="margin:0;color:#93A0BD;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
        <a href="mailto:${escapeHtml(email)}?subject=Re: your message"
           style="display:inline-block;margin-top:22px;padding:11px 20px;background:#F5A623;color:#160F02;text-decoration:none;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;">
          Reply to ${escapeHtml(name)}
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#5B6478;font-size:11px;margin-top:16px;font-family:Arial,sans-serif;">
      Sent from the contact form on your portfolio
    </p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL || 'gloryolosunde14@gmail.com',
        reply_to: email.includes('@') ? email : undefined,
        subject: `New portfolio message from ${name}`,
        html
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Email send failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('sendContactEmail error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};