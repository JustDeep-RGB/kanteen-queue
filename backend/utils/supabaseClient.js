const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    '[Supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env'
  );
}

/**
 * Service-role client — bypasses RLS.
 * Use ONLY on the server. Never expose SERVICE_ROLE_KEY to the client.
 */
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

module.exports = supabase;
