const { Op, fn, col, where } = require('sequelize');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');
const { logAudit } = require('./auditController');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_aws_customer_report_2026', {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({
      where: where(fn('LOWER', col('email')), cleanEmail)
    });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role || 'staff',
      phone: phone || ''
    });

    if (user) {
      await logAudit(user.id, 'User Register', `New ${user.role} account registered: ${user.name}.`, user.name, user.role);
      res.status(201).json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user case-insensitively
    const user = await User.findOne({
      where: where(fn('LOWER', col('email')), cleanEmail)
    });

    if (user && (await user.matchPassword(password.trim()))) {
      await logAudit(user.id, 'User Login', `${user.role.toUpperCase()} successfully authenticated on Amazon RDS.`, user.name, user.role);
      return res.json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({
      where: where(fn('LOWER', col('email')), cleanEmail)
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please use the link below:\n\n${resetUrl}`;

    try {
      const sendEmail = require('../utils/sendEmail');

      if (!process.env.SMTP_HOST) {
        console.log('Skipping email send (No SMTP Config). Reset Link:', resetUrl);
        return res.status(200).json({ success: true, data: 'Password reset link generated (Check server console)' });
      }

      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = (req.body.email || user.email).trim().toLowerCase();
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.notifications !== undefined) user.notifications = req.body.notifications;

    await user.save();
    await logAudit(user.id, 'Profile Update', `${user.name} updated their profile settings.`, user.name, user.role);

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};
