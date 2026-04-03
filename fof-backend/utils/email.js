const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendEmail({ email, subject, message, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured. Email not sent.');
        console.log(`To: ${email}\nSubject: ${subject}\nBody: ${message || 'HTML content'}`);
        return;
    }

    try {
        console.log(`[EMAIL_SERVICE] Attempting to send email to: ${email} | Subject: ${subject}`);
        await transporter.sendMail({
            from: `"Faith Over Fear" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            text: message,
            html: html
        });
        console.log(`✅ [EMAIL_SERVICE] Email sent successfully to ${email}`);
    } catch (error) {
        console.error(`❌ [EMAIL_SERVICE] Failed to send email to ${email}:`, error.message);
        throw error; // Re-throw to allow controller to handle/log it
    }
}

async function notifyNewDrop(userEmails, dropDetails) {
    const { name, price, images } = dropDetails;
    const dropName = name || 'New Collection';
    const dropPrice = price ? `${price.toLocaleString()} FRW` : 'Coming Soon';
    const dropImage = (images && images.length > 0) ? images[0] : 'https://placehold.co/400x400?text=F%3EF+Drop';

    const subject = `NEW DROP: ${dropName} is now available!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #888; margin-top: 5px;">Faith Over Fear</p>
            
            <div style="margin: 40px 0;">
                <img src="${dropImage}" alt="${dropName}" style="width: 100%; max-width: 400px; border: 1px solid #333;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 24px; margin-bottom: 10px;">${dropName}</h2>
            <p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Available now for ${dropPrice}</p>
            
            <a href="https://yourwebsite.com/product.html" style="background: #fff; color: #000; text-decoration: none; padding: 15px 40px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Shop The Drop</a>
            
            <div style="margin-top: 60px; padding-top: 20px; border-t: 1px solid #222; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                &copy; 2024 Faith Over Fear. All Rights Reserved.
            </div>
        </div>
    `;

    for (const email of userEmails) {
        await sendEmail({ email, subject, html });
    }
}

async function notifyLiveDrop(userEmails, dropDetails) {
    const { title, name, price, images } = dropDetails;
    const dropName = title || name || 'Collection';
    const dropPrice = price ? `${price.toLocaleString()} FRW` : '';
    const dropImage = (images && images.length > 0) ? images[0] : 'https://placehold.co/400x400?text=F%3EF+Drop';

    const subject = `🔥 ${dropName} IS LIVE NOW!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #888; margin-top: 5px;">Faith Over Fear</p>
            
            <div style="margin: 40px 0;">
                <img src="${dropImage}" alt="${dropName}" style="width: 100%; max-width: 400px; border: 1px solid #333;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 24px; margin-bottom: 10px; color: #ff3333;">IT'S LIVE. NO MORE WAITING.</h2>
            <p style="font-size: 18px; color: #ddd; margin-bottom: 30px;">${dropName} is available to purchase now for ${dropPrice}. Act fast.</p>
            
            <a href="https://yourwebsite.com/shop.html" style="background: #fff; color: #000; text-decoration: none; padding: 15px 40px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Buy Now</a>
            
            <div style="margin-top: 60px; padding-top: 20px; border-t: 1px solid #222; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                &copy; 2026 Faith Over Fear. All Rights Reserved.
            </div>
        </div>
    `;

    for (const email of userEmails) {
        await sendEmail({ email, subject, html });
    }
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
