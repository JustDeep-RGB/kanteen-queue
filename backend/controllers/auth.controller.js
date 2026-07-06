'use strict';

const crypto    = require('crypto');
const jwt       = require('jsonwebtoken');
const supabase  = require('../utils/supabaseClient');
const { sendOtpEmail } = require('../utils/mailer');
const passport  = require('../utils/passport');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a signed app-level JWT for the given user row. */
function signToken(user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET env var is not set.');
  return jwt.sign(
    { userId: user.id, role: user.role, provider: user.provider || 'email' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/** Generates a cryptographically random 6-digit OTP string. */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// ─── OTP: Send ────────────────────────────────────────────────────────────────

/**
 * POST /auth/send-otp
 * Body: { email }
 *
 * Generates a 6-digit OTP and emails it to the user.
 * Does NOT create a user record — that happens on verify.
 */
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const otp       = generateOtp();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Upsert OTP into users table (create row if first-time, update if exists)
  const { error: upsertErr } = await supabase
    .from('users')
    .upsert(
      { email, otp, otp_expiry: otpExpiry.toISOString(), provider: 'email' },
      { onConflict: 'email', ignoreDuplicates: false }
    );

  if (upsertErr) {
    return res.status(500).json({ error: 'Failed to store OTP. Please try again.' });
  }

  try {
    await sendOtpEmail(email, otp);
  } catch (mailErr) {
    // Roll back OTP so stale codes don't linger
    await supabase.from('users').update({ otp: null, otp_expiry: null }).eq('email', email);
    return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
  }

  return res.status(200).json({ message: 'OTP sent. Check your email.' });
};

// ─── OTP: Verify ─────────────────────────────────────────────────────────────

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 *
 * Validates OTP + expiry. If valid, finds/creates the user and returns a JWT.
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'email and otp are required.' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Database error. Please try again.' });
  }

  if (!user || !user.otp) {
    return res.status(400).json({ error: 'No OTP was requested for this email.' });
  }

  if (user.otp !== String(otp)) {
    return res.status(401).json({ error: 'Invalid OTP.' });
  }

  if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
    return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // ── Ensure user has a name; default to email prefix ───────────────────────
  const name = user.name || email.split('@')[0];

  // ── Clear OTP and mark provider ───────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({ otp: null, otp_expiry: null, provider: 'email', name })
    .eq('email', email)
    .select()
    .single();

  if (updateErr) {
    return res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }

  const token = signToken(updated);
  return res.status(200).json({ token, user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } });
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * GET /auth/google
 * Redirects the browser to Google's consent screen.
 */
const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

/**
 * GET /auth/google/callback
 * Passport verifies the code, runs the strategy verify callback,
 * then this handler issues a JWT and redirects / responds.
 */
const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  (req, res) => {
    try {
      const user  = req.user; // set by passport strategy
      const token = signToken(user);

      // Respond with JSON or redirect with token in query (choose per your frontend)
      const clientUrl = process.env.CLIENT_URL;
      if (clientUrl) {
        return res.redirect(`${clientUrl}/auth/callback?token=${token}`);
      }
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (err) {
      return res.status(500).json({ error: 'Token generation failed after OAuth.' });
    }
  },
];

/**
 * GET /auth/google/failure
 * Called when Google OAuth fails (user denied consent, etc).
 */
const googleFailure = (_req, res) => {
  res.status(401).json({ error: 'Google authentication failed or was cancelled.' });
};

module.exports = { sendOtp, verifyOtp, googleAuth, googleCallback, googleFailure };
