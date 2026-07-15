const settingsRepo = require('../repositories/settings.repository');
const waitlistRepo = require('../repositories/waitlist.repository');
const { sendEmail } = require('../../utils/email');

function buildClosedEmail({ imageUrls }) {
  const subject = '⏳ SITE CLOSED — WAITLIST CONFIRMED';
  const images = Array.isArray(imageUrls) ? imageUrls : [];
  const mainImage = images[0] || 'https://placehold.co/600x400/000000/FFFFFF/png?text=F%3EF';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center; border: 2px solid #f33;">
      <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F>F</h1>
      <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #f33; margin-top: 5px; font-weight: bold;">We’re taking a short break</p>

      <div style="margin: 36px 0;">
        <img src="${mainImage}" alt="Faith Over Fear" style="width: 100%; max-height: 360px; object-fit: cover; border: 1px solid #333; border-radius: 12px;" />
      </div>

      <h2 style="text-transform: uppercase; font-size: 22px; margin: 0 0 12px; color: #fff; font-weight: 900;">You’ll be notified when we’re live again.</h2>
      <p style="font-size: 14px; color: #ccc; margin: 0 0 28px;">Thanks for joining. New drops will be announced as soon as the site opens.</p>
    </div>
  `;

  return { subject, html };
}

function buildLiveEmail({ shopUrl }) {
  const subject = '🔥 WE’RE LIVE — NEW DROP IS AVAILABLE';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center; border: 2px solid #f33;">
      <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F>F</h1>
      <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #f33; margin-top: 5px; font-weight: bold;">Live Release</p>

      <h2 style="text-transform: uppercase; font-size: 28px; margin: 22px 0 12px; color: #fff; font-weight: 900;">Now open for sale</h2>
      <p style="font-size: 14px; color: #ccc; margin: 0 0 28px;">Shop while quantities are limited.</p>

      <a href="${shopUrl}" style="background: #f33; color: #fff; text-decoration: none; padding: 18px 44px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 4px; display: inline-block; border-radius: 8px;">Shop Now</a>
    </div>
  `;

  return { subject, html };
}

async function broadcastSubscribers(req, res) {
  try {
    const settings = await settingsRepo.getSettings();
    const siteStatus = String(settings.siteStatus || 'closed').toLowerCase();

    const closedImagesValue = settings.siteClosedImages;
    let imageUrls = [];
    if (typeof closedImagesValue === 'string') {
      const trimmed = closedImagesValue.trim();
      if (trimmed.startsWith('[')) {
        try {
          imageUrls = JSON.parse(trimmed);
        } catch {
          imageUrls = [];
        }
      } else {
        // fallback comma split
        imageUrls = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(closedImagesValue)) {
      imageUrls = closedImagesValue;
    }

    // Load unnotified subscribers
    const unnotified = await waitlistRepo.findUnnotified(5000);
    const entries = unnotified.filter(e => e && e.email);

    if (entries.length === 0) {
      return res.status(200).json({ success: true, sent: 0, markedNotified: 0, status: siteStatus, message: 'No unnotified subscribers.' });
    }

    const hasResend = !!(process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY);
    console.log(`📧 [BROADCAST] Resend configured: ${hasResend} | RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY} | EMAIL_API_KEY present: ${!!process.env.EMAIL_API_KEY} | siteStatus: ${siteStatus} | unnotified: ${entries.length}`);
    const shopUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://faithoverfear.rw/shop.html';

    const { subject, html } = siteStatus === 'live'
      ? buildLiveEmail({ shopUrl: `${shopUrl}` })
      : buildClosedEmail({ imageUrls });

    // If Resend isn't configured we must NOT mark entries notified,
    // otherwise they'd be permanently skipped without ever receiving an email.
    if (!hasResend) {
      return res.status(200).json({
        success: true,
        sent: 0,
        markedNotified: 0,
        status: siteStatus,
        warning: 'RESEND_API_KEY (or EMAIL_API_KEY) is not configured on the backend. No emails were sent. Set the key and restart the backend, then broadcast again.'
      });
    }

    const results = await Promise.allSettled(
      entries.map(e => sendEmail({ email: e.email, subject, html }))
    );

    const sentIds = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        sentIds.push(entries[i].id);
      } else {
        console.error(`❌ [BROADCAST] Failed to send to ${entries[i].email}:`, r.reason?.message || r.reason);
      }
    });

    const sentCount = sentIds.length;
    console.log(`📧 [BROADCAST] Attempted: ${entries.length} | Sent OK: ${sentCount} | Failed: ${entries.length - sentCount}`);
    if (sentIds.length > 0) {
      await waitlistRepo.markNotified(sentIds);
    }

    return res.json({
      success: true,
      sent: sentCount,
      markedNotified: sentIds.length,
      status: siteStatus,
      warning: sentCount < entries.length ? `${entries.length - sentCount} email(s) failed to send.` : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Broadcast failed' });
  }
}

module.exports = {
  broadcastSubscribers,
};

