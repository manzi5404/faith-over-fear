const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    family: 4, // Force IPv4 to avoid IPv6 connectivity issues on Railway
    connectionTimeout: 10000,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    }
});

async function sendEmail({ email, subject, message, html }) {
    const authUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const authPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!authUser || !authPass) {
        console.warn('⚠️  [EMAIL_SERVICE] NOT_CONFIGURED: Missing EMAIL_USER/PASS. Email suppressed.');
        console.log(`[STUB] To: ${email}\n[STUB] Subject: ${subject}`);
        return;
    }

    try {
        console.log(`📨 [EMAIL_SERVICE] Attempting delivery to: ${email}...`);
        await transporter.sendMail({
            from: `"Faith Over Fear" <${authUser}>`,
            to: email,
            subject: subject,
            text: message,
            html: html
        });
        console.log(`✅ [EMAIL_SERVICE] Success for ${email}`);
    } catch (error) {
        console.error(`❌ [EMAIL_SERVICE] Delivery failed for ${email}:`, error.message);
        throw error; // Re-throw to allow batch summary to track it
    }
}

async function notifyNewDrop(userEmails, dropDetails) {
    const { title, name, description, release_date, image_url } = dropDetails;
    const dropName = title || name || 'New Collection';
    const dropDesc = description || 'Our latest collection has arrived. Explore the spirit of resilience.';
    const dropDate = release_date ? new Date(release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Coming Soon';
    const dropImage = image_url || 'https://placehold.co/600x400/000000/FFFFFF/png?text=F%3EF+NEW+DROP';
    const shopUrl = process.env.CLIENT_URL || 'https://faithoverfear.rw';

    const subject = `NEW DROP: ${dropName} - Now Live`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center; border: 1px solid #222;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0; font-weight: 900;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #888; margin-top: 5px; font-weight: bold;">Faith Over Fear</p>
            
            <div style="margin: 40px 0; background: #111;">
                <img src="${dropImage}" alt="${dropName}" style="width: 100%; max-height: 400px; object-fit: cover; border: 1px solid #333;">
            </div>
            
            <div style="text-align: left; padding: 0 20px;">
                <h2 style="text-transform: uppercase; font-size: 28px; margin-bottom: 15px; letter-spacing: -1px;">${dropName}</h2>
                <p style="font-size: 14px; color: #aaa; line-height: 1.6; margin-bottom: 20px;">${dropDesc}</p>
                <p style="font-size: 12px; font-weight: bold; color: #f33; text-transform: uppercase; letter-spacing: 1px;">Release Date: ${dropDate}</p>
            </div>
            
            <div style="margin-top: 40px;">
                <a href="${shopUrl}/shop.html" style="background: #fff; color: #000; text-decoration: none; padding: 18px 50px; font-weight: 900; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; display: inline-block;">Explore Collection</a>
            </div>
            
            <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #111; font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 2px;">
                &copy; 2026 Faith Over Fear. Movement Of Believers.
            </div>
        </div>
    `;

    console.log(`[BATCH_NOTIFY] Initializing mailing for ${userEmails.length} subscribers...`);
    const results = await Promise.allSettled(userEmails.map(email => sendEmail({ email, subject, html })));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[BATCH_NOTIFY] Completed. Success: ${successful} | Failed: ${failed}`);
}

async function notifyLiveDrop(userEmails, dropDetails) {
    const { title, name, description, image_url } = dropDetails;
    const dropName = title || name || 'New Drop';
    const dropImage = image_url || 'https://placehold.co/600x400/000000/FFFFFF/png?text=F%3EF+LIVE+NOW';
    const shopUrl = process.env.CLIENT_URL || 'https://faithoverfear.rw';

    const subject = `🔥 ${dropName} IS LIVE NOW!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center; border: 2px solid #f33;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #f33; margin-top: 5px; font-weight: bold;">Live Release</p>
            
            <div style="margin: 40px 0;">
                <img src="${dropImage}" alt="${dropName}" style="width: 100%; max-height: 400px; object-fit: cover; border: 1px solid #444;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 32px; margin-bottom: 10px; color: #fff; font-weight: 900;">NO MORE WAITING.</h2>
            <p style="font-size: 16px; color: #ccc; margin-bottom: 30px;">The <strong>${dropName}</strong> collection is officially live. Quantities are extremely limited.</p>
            
            <a href="${shopUrl}/shop.html" style="background: #f33; color: #fff; text-decoration: none; padding: 20px 60px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 4px; display: inline-block;">Shop Now</a>
            
            <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #111; font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 2px;">
                &copy; 2026 Faith Over Fear. Resilience Over Comfort.
            </div>
        </div>
    `;

    console.log(`[LIVE_BATCH] Broadcasting live alert to ${userEmails.length} users...`);
    const results = await Promise.allSettled(userEmails.map(email => sendEmail({ email, subject, html })));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[LIVE_BATCH] Broadcasting finished. Success: ${successful} | Failed: ${failed}`);
}

async function notifyReservation(userEmail, reservationData, productData) {
    const { fullName, phone, size, color, quantity, storeMode } = reservationData;
    const productName = productData?.name || 'Product';
    const productPrice = productData?.price ? `${productData.price.toLocaleString()} FRW` : 'N/A';
    const productImage = (productData?.image_urls && productData.image_urls.length > 0) ? productData.image_urls[0] : 'https://placehold.co/400x400?text=F%3EF+Reservations';

    const subject = `RESERVATION CONFIRMED: ${productName}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #888; margin-top: 5px;">Faith Over Fear</p>
            
            <div style="margin: 40px 0;">
                <img src="${productImage}" alt="${productName}" style="width: 100%; max-width: 300px; border: 1px solid #333;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 24px; margin-bottom: 10px;">${productName} Reserved</h2>
            <p style="font-size: 16px; color: #aaa; margin-bottom: 30px;">
                We've received your reservation for the <strong>${productName}</strong>.<br>
                Mode: <span style="color: #fff; text-transform: uppercase;">${storeMode}</span>
            </p>
            
            <div style="background: #111; padding: 20px; border: 1px solid #222; text-align: left; margin-bottom: 30px;">
                <p style="margin: 5px 0; font-size: 12px; color: #888;">Size: <span style="color: #fff;">${size}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #888;">Color: <span style="color: #fff;">${color}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #888;">Quantity: <span style="color: #fff;">${quantity}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #888;">Price: <span style="color: #fff;">${productPrice}</span></p>
            </div>
            
            <p style="font-size: 14px; color: #888; margin-bottom: 40px;">Our team will contact you shortly via ${phone} for final fulfillment details.</p>
            
            <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #222; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                &copy; 2026 Faith Over Fear. Movement of Resilience.
            </div>
        </div>
    `;

    // 1. Send confirmation to customer
    await sendEmail({ email: userEmail, subject, html });

    // 2. Send notification to admin (if configured)
    if (process.env.ADMIN_EMAIL) {
        await sendEmail({
            email: process.env.ADMIN_EMAIL,
            subject: `🚨 NEW RESERVATION ALERT: ${fullName}`,
            message: `New reservation received from ${fullName} (${userEmail}) for ${productName}. Phone: ${phone}. Mode: ${storeMode}.`
        });
    }
}

module.exports = {
    sendEmail,
    notifyNewDrop,
    notifyLiveDrop,
    notifyReservation
};
