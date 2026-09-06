const { Resend } = require('resend');

const NOTIFY_TO = 'rory@manifestdigital.com.au';
const FROM_ADDRESS = process.env.CONTACT_FROM_EMAIL || 'Skyway Cleaning <onboarding@resend.dev>';

const MAX_LENGTHS = {
  name: 200,
  phone: 40,
  email: 200,
  address: 300,
  propertyType: 100,
  service: 100,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Normalizes the raw request body into the shape the rest of this file expects.
// Keeping this separate makes it easy to add fields later without touching validation/send logic.
function buildLead(body) {
  return {
    name: (body.name || '').toString().trim(),
    phone: (body.phone || '').toString().trim(),
    email: (body.email || '').toString().trim(),
    address: (body.address || '').toString().trim(),
    propertyType: (body.propertyType || '').toString().trim(),
    service: (body.service || '').toString().trim(),
    submittedAt: new Date().toISOString(),
    source: 'skywaycleaning.com.au — quote form',
  };
}

function validateLead(lead) {
  if (!lead.name || lead.name.length > MAX_LENGTHS.name) {
    return 'Please enter your name.';
  }
  if (!lead.phone || lead.phone.length > MAX_LENGTHS.phone) {
    return 'Please enter a valid phone number.';
  }
  if (!lead.email || lead.email.length > MAX_LENGTHS.email || !isValidEmail(lead.email)) {
    return 'Please enter a valid email address.';
  }
  if (lead.address.length > MAX_LENGTHS.address) {
    return 'Address is too long.';
  }
  if (lead.propertyType.length > MAX_LENGTHS.propertyType || lead.service.length > MAX_LENGTHS.service) {
    return 'Invalid property type or service value.';
  }
  return null;
}

function leadToHtml(lead) {
  const row = (label, value) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5a7183;font-size:13px;white-space:nowrap">${label}</td><td style="padding:4px 0;color:#0c2031;font-size:14px">${value || '—'}</td></tr>`;

  return `
    <div style="font-family:sans-serif">
      <h2 style="margin:0 0 16px">New quote request</h2>
      <table cellpadding="0" cellspacing="0">
        ${row('Name', escapeHtml(lead.name))}
        ${row('Phone', escapeHtml(lead.phone))}
        ${row('Email', escapeHtml(lead.email))}
        ${row('Address', escapeHtml(lead.address))}
        ${row('Property type', escapeHtml(lead.propertyType))}
        ${row('Service required', escapeHtml(lead.service))}
      </table>
      <p style="color:#8a99a3;font-size:12px;margin-top:20px">Submitted ${lead.submittedAt} via ${lead.source}</p>
    </div>
  `;
}

// Placeholder for a future CRM sync (e.g. HubSpot, Pipedrive, a Google Sheet via API).
// Call this alongside sendNotificationEmail once credentials/config exist — it's a no-op today.
async function syncToCrm(lead) {
  return;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid request body.' });
    }
  }
  body = body || {};

  // Honeypot — real visitors never see or fill this field, bots usually fill every field.
  // Reply 200 so bots don't learn the submission was rejected.
  if (body._hp) {
    return res.status(200).json({ success: true });
  }

  const lead = buildLead(body);
  const validationError = validateLead(lead);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set.');
    return res.status(500).json({ success: false, error: 'Server is not configured to send email.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: NOTIFY_TO,
      replyTo: lead.email,
      subject: `New quote request from ${lead.name}`,
      html: leadToHtml(lead),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ success: false, error: 'Could not send your message. Please call us instead.' });
    }

    await syncToCrm(lead);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again or call us.' });
  }
};
