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
        await transporter.sendMail({
            from: `"Faith Over Fear" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            text: message,
            html: html
        });
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
    }
}

async function notifyNewDrop(userEmails, dropDetails) {
    const { name, price, images } = dropDetails;
    const subject = `NEW DROP: ${name} is now available!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center;">
            <h1 style="letter-spacing: -2px; font-size: 48px; margin-bottom: 0;">F&gt;F</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #888; margin-top: 5px;">Faith Over Fear</p>
            
            <div style="margin: 40px 0;">
                <img src="${images[0]}" alt="${name}" style="width: 100%; max-width: 400px; border: 1px solid #333;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 24px; margin-bottom: 10px;">${name}</h2>
            <p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Available now for ${price.toLocaleString()} FRW</p>
            
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

module.exports = {
    sendEmail,
    notifyNewDrop
};
