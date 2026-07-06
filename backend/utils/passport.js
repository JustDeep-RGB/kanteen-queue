'use strict';

const passport              = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const supabase              = require('./supabaseClient');

/**
 * Configures Passport with the Google OAuth 2.0 strategy.
 * On successful Google sign-in, finds or creates a row in public.users.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL   (e.g. http://localhost:5000/api/auth/google/callback)
 */
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope:        ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email    = profile.emails?.[0]?.value;
        const name     = profile.displayName || profile.emails?.[0]?.value || 'Google User';
        const googleId = profile.id;

        if (!email) {
          return done(new Error('Google profile did not return an email address.'));
        }

        // ── Look up existing user by email ───────────────────────────────────
        let { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) return done(error);

        if (!user) {
          // ── Create new user ──────────────────────────────────────────────
          const { data: created, error: createErr } = await supabase
            .from('users')
            .insert({ email, name, provider: 'google', google_id: googleId, role: 'customer' })
            .select()
            .single();

          if (createErr) return done(createErr);
          user = created;
        } else if (user.provider !== 'google') {
          // ── Update provider to google if user previously used email OTP ──
          await supabase
            .from('users')
            .update({ provider: 'google', google_id: googleId })
            .eq('id', user.id);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Stateless — no session serialisation needed
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
