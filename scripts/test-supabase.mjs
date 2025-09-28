import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function parseDotEnv(content) {
  const lines = content.split(/\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

const envPath = path.resolve(process.cwd(), '.env');
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  env = parseDotEnv(content);
} else {
  console.error('.env file not found in project root. Please create one from .env.example');
  process.exit(2);
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(2);
}

console.log('Testing Supabase connection to', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // small timeout
  global: { fetch: fetch }
});

(async () => {
  try {
    // Try a simple request: get project metadata via REST (health) is not available,
    // so attempt a lightweight select on reader_progress.
    const { data, error, status } = await supabase.from('reader_progress').select('id').limit(1);
    if (error) {
      console.error('Query returned an error (this may be fine if table does not exist yet):', error.message || error);
      console.error('Full error object:', error);
      process.exit(1);
    }
    console.log('Success. Sample response:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error while connecting to Supabase:', err.message || err);
    console.error(err);
    process.exit(1);
  }
})();
