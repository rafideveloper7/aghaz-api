const SiteSettings = require('../models/SiteSettings');

function sanitizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function sendFormSubmitEmail({ subject, message, replyTo, payload }) {
  const settings = await SiteSettings.findOne().lean();
  const targetEmail = sanitizeEmail(settings?.formSubmitEmail || settings?.contactEmail);

  if (!targetEmail) {
    return { sent: false, reason: 'missing-target-email' };
  }

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      _replyto: replyTo || targetEmail,
      message,
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FormSubmit request failed with status ${response.status}: ${errorText}`);
  }

  return { sent: true, targetEmail };
}

module.exports = {
  sendFormSubmitEmail,
};
