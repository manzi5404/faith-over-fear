const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/user');
const resetModel = require('../models/passwordReset');

// Mock email utility for now - will implement Phase 4
const sendEmail = async (options) => {
    console.log(`Sending email to ${options.email}: ${options.subject}`);
    console.log(`Message: ${options.message}`);
};

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
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await resetModel.createResetToken(user.id, resetToken, expiresAt);

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message: `You requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.`
        });

        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const tokenInfo = await resetModel.getTokenInfo(token);
        if (!tokenInfo) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const password_hash = await bcrypt.hash(newPassword, 12);
        await userModel.updatePassword(tokenInfo.user_id, password_hash);
        await resetModel.deleteToken(token);

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword
};
