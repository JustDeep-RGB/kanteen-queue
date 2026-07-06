'use strict';

const nodemailer = require('nodemailer');

/**
 * SMTP transporter — configure via environment variables:
 *   MAIL_HOST     e.g. smtp.gmail.com
 *   MAIL_PORT     e.g. 587
 *   MAIL_USER     e.g. noreply@yourdomain.com
 *   MAIL_PASS     App password / SMTP password
 *   MAIL_FROM     "Smart Canteen <noreply@yourdomain.com>"
 */
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Sends a 6-digit OTP to the given email address.
 * @param {string} to    Recipient email
 * @param {string} otp   6-digit OTP string
 */
async function sendOtpEmail(to, otp) {
  const from = process.env.MAIL_FROM || `"Smart Canteen" <${process.env.MAIL_USER}>`;
  await transporter.sendMail({
    from,
    to,
    subject: 'Your Smart Canteen Login Code',
    text: `Your one-time login code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#333;margin-bottom:8px;">Smart Canteen</h2>
        <p style="color:#555;">Use the code below to log in. It expires in <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111;margin:24px 0;text-align:center;">
          ${otp}
        </div>
        <p style="color:#888;font-size:12px;">If you did not request this code, you can safely ignore this email.</p>
      </div>`,
  });
}

module.exports = { transporter, sendOtpEmail };
