import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://rnlijzolilwweptwbakv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGlqem9saWx3d2VwdHdiYWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ0NzEzMCwiZXhwIjoyMDc0MDIzMTMwfQ.4L3CT3xHBm1rS0gfrpFDm_A1ij7_VTmeRGQmAR0Bjus';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filePath) {
  console.log(`\n📁 Running migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }

    console.log(`✅ Success!`);
    return true;
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file>');
    process.exit(1);
  }

  const fullPath = path.join(__dirname, migrationFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const success = await runMigration(fullPath);
  process.exit(success ? 0 : 1);
}

main();
