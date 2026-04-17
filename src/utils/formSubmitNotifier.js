const SiteSettings = require('../models/SiteSettings');

function sanitizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function sendFormSubmitEmail({ subject, message, replyTo, payload }) {
  try {
    const settings = await SiteSettings.findOne().lean();
    const targetEmail = sanitizeEmail(settings?.formSubmitEmail || settings?.contactEmail);

    console.log('[FormSubmit] Attempting to send email to:', targetEmail);

    if (!targetEmail) {
      console.warn('[FormSubmit] No target email configured');
      return { sent: false, reason: 'missing-target-email' };
    }

    const formData = new URLSearchParams();
    formData.append('_subject', subject);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');
    if (replyTo) formData.append('_replyto', replyTo);
    formData.append('message', message);
    
    if (payload) {
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('[FormSubmit] Response status:', response.status);
    console.log('[FormSubmit] Response body:', responseText);

    if (!response.ok) {
      throw new Error(`FormSubmit request failed with status ${response.status}: ${responseText}`);
    }

    return { sent: true, targetEmail };
  } catch (error) {
    console.error('[FormSubmit] Error sending email:', error.message);
    throw error;
  }
}

module.exports = {
  sendFormSubmitEmail,
};
