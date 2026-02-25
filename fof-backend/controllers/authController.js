const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/user');
const resetModel = require('../models/passwordReset');

const emailUtils = require('../utils/email');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await userModel.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const userId = await userModel.createUser({ email, password_hash, name });

        const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'fof_secret', { expiresIn: '1h' });

        res.status(201).json({ token, userId, name });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.password_hash) {
            return res.status(400).json({ message: 'Account registered with Google. Please use Google Login.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'fof_secret', { expiresIn: '1h' });

        res.status(200).json({ token, userId: user.id, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await userModel.getUserByEmail(email);
        if (!user) {
            // Recommendation: Send 200 even if user doesn't exist for security, 
            // but the requirement says "success or error". 
            // I'll stick to 404 for clarity as per "Forgot password flow does not complete properly" context.
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await resetModel.createResetToken(user.id, resetToken, expiresAt);

        // Dynamically get the protocol and host from the request headers if possible, 
        // or use req.headers.origin which is usually the frontend URL.
        const frontendUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
        const resetUrl = `${frontendUrl}/reset-password.html?token=${resetToken}`;

        await emailUtils.sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message: `You requested a password reset for your Faith Over Fear account.\n\nPlease click on the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, please ignore this email.`
        });

        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Something went wrong while processing reset request', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const tokenInfo = await resetModel.getTokenInfo(token);
        if (!tokenInfo) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const password_hash = await bcrypt.hash(newPassword, 12);
        await userModel.updatePassword(tokenInfo.user_id, password_hash);

        // Clear all reset tokens for this user after successful reset
        await resetModel.deleteTokensByUserId(tokenInfo.user_id);

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Something went wrong during password reset', error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, sub: google_id } = ticket.getPayload();

        let user = await userModel.getUserByGoogleId(google_id);

        if (!user) {
            // Check if user exists with the same email
            user = await userModel.getUserByEmail(email);
            if (user) {
                // Account Linking: User exists with email but hasn't linked Google yet
                await userModel.linkGoogleAccount(user.id, google_id);
                // Fetch updated user to ensure we have the linked ID (though not strictly necessary for the JWT)
                user = await userModel.getUserById(user.id);
            } else {
                // Account Creation: New user
                const userId = await userModel.createUser({
                    email,
                    name,
                    google_id,
                    password_hash: null // No password for Google users
                });
                user = await userModel.getUserById(userId);
            }
        }

        const jwtToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fof_secret',
            { expiresIn: '24h' } // Increased expiry for better UX, or keep '1h' if preferred
        );

        res.status(200).json({ token: jwtToken, userId: user.id, name: user.name });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Google authentication failed', error: error.message });
    }
};

module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword,
    googleLogin
};
