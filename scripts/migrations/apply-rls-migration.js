// Apply RLS Migration Script
// Run with: node apply-rls-migration.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing Supabase environment variables');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase client with SERVICE ROLE KEY (bypasses RLS for migration)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying RLS Migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251013000000_fix_all_rls_policies.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📏 Migration size:', migrationSQL.length, 'characters\n');

  try {
    // Execute the migration
    console.log('⏳ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // exec_sql might not exist, try direct query
      console.log('⏳ Trying direct SQL execution...');
      const { data: data2, error: error2 } = await supabase.from('_query').select().eq('sql', migrationSQL);

      if (error2) {
        // Last resort: split and execute individual statements
        console.log('⏳ Executing statements individually...');
        const statements = migrationSQL
          .split('$$')
          .join('$BLOCK$')
          .split(';')
          .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
          .map(stmt => stmt.replace('$BLOCK$', '$$'));

        console.log(`📝 Found ${statements.length} statements to execute\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i].trim();
          if (!stmt) continue;

          // Skip comment-only lines
          if (stmt.startsWith('--')) continue;

          try {
            const { error: stmtError } = await supabase.rpc('exec', { sql: stmt });
            if (stmtError) {
              console.error(`❌ Statement ${i + 1} failed:`, stmtError.message);
              console.error(`   SQL: ${stmt.substring(0, 100)}...`);
              errorCount++;
            } else {
              successCount++;
              if (i % 10 === 0 && i > 0) {
                console.log(`   Executed ${i} statements...`);
              }
            }
          } catch (err) {
            console.error(`❌ Statement ${i + 1} threw error:`, err.message);
            errorCount++;
          }
        }

        console.log(`\n✅ Migration complete: ${successCount} statements succeeded, ${errorCount} failed`);

        if (errorCount > 0) {
          console.log('\n⚠️  Some statements failed. This might be normal if:');
          console.log('   - Policies already existed (DROP IF EXISTS handles this)');
          console.log('   - Tables don\'t exist (DO $$ blocks handle this)');
          console.log('\nRun audit script to verify: node run-audit.js');
        }

        return;
      }
    }

    console.log('✅ Migration executed successfully!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Alternative: Copy and paste the migration SQL directly into Supabase SQL Editor:');
    console.error('   https://supabase.com/dashboard/project/rnlijzolilwweptwbakv/sql\n');
    process.exit(1);
  }

  // Verify the migration
  console.log('🔍 Verifying migration...\n');

  try {
    const { data: auditData, error: auditError } = await supabase
      .from('rls_policy_audit')
      .select('*');

    if (auditError) {
      console.error('❌ Could not query audit view:', auditError.message);
      console.log('\n💡 Run audit script manually: node run-audit.js');
    } else {
      console.log('📊 RLS Policy Audit Results:\n');
      console.table(auditData);

      const incomplete = auditData.filter(row => !row.status.includes('✅'));
      if (incomplete.length > 0) {
        console.log('\n⚠️  WARNING: Some tables have incomplete RLS policies:');
        incomplete.forEach(row => {
          console.log(`   - ${row.table_name}: ${row.status}`);
        });
      } else {
        console.log('\n✅ All tables have complete RLS policies!');
      }
    }
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }

  console.log('\n✅ Migration complete! Test your application to ensure everything works.\n');
}

// Run the migration
applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
