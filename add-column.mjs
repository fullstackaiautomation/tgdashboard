import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  console.log('Testing if google_llm column exists...');
  
  // Try to query the column
  const { data, error } = await supabase
    .from('content_library')
    .select('id, google_llm')
    .limit(1);
  
  if (error) {
    if (error.message.includes('google_llm')) {
      console.log('❌ Column does not exist. You need to add it via Supabase SQL Editor.');
      console.log('\nRun this SQL in Supabase Dashboard > SQL Editor:\n');
      console.log('ALTER TABLE content_library');
      console.log('ADD COLUMN IF NOT EXISTS google_llm BOOLEAN DEFAULT NULL;');
      console.log('\nOr visit: https://supabase.com/dashboard/project/rnlijzolilwweptwbakv/sql/new');
    } else {
      console.error('Error:', error);
    }
  } else {
    console.log('✅ Column already exists!');
    console.log('Sample data:', data);
  }
}

addColumn();
