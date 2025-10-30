#!/usr/bin/env node

/**
 * Schedule Data Migration Script
 * Story 6.1: Data Migration - Scheduled Tasks to Time Blocks
 *
 * Usage:
 *   node scripts/migrate-schedule-data.js --dry-run   # Preview migration
 *   node scripts/migrate-schedule-data.js --execute   # Execute migration
 *   node scripts/migrate-schedule-data.js --rollback  # Rollback migration
 *   node scripts/migrate-schedule-data.js --verify    # Verify migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Command-line argument
const command = process.argv[2];

// =============================================================================
// DRY RUN: Preview migration without making changes
// =============================================================================
async function dryRun() {
  console.log('\n📋 DRY RUN MODE - Previewing migration...\n');

  try {
    // Count tasks to migrate
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .not('scheduled_date', 'is', null);

    if (error) throw error;

    console.log(`📊 Tasks with scheduled_date: ${count || 0}`);

    // Sample tasks to migrate
    const { data: sampleTasks, error: sampleError } = await supabase
      .from('tasks')
      .select('id, task_name, scheduled_date, scheduled_time')
      .not('scheduled_date', 'is', null)
      .limit(10);

    if (sampleError) throw sampleError;

    if (sampleTasks && sampleTasks.length > 0) {
      console.log('\n📄 Sample tasks to migrate:\n');
      sampleTasks.forEach(task => {
        const resolvedTime = task.scheduled_time || '09:00:00';
        console.log(`   • [${task.id.substring(0, 8)}...] ${task.task_name}`);
        console.log(`     Date: ${task.scheduled_date}, Time: ${task.scheduled_time || '(default to 09:00)'} → ${resolvedTime}`);
      });
    }

    // Count existing time blocks
    const { count: blockCount, error: blockError } = await supabase
      .from('task_time_blocks')
      .select('*', { count: 'exact', head: true });

    if (blockError) throw blockError;

    console.log(`\n📊 Existing time blocks: ${blockCount || 0}`);

    console.log('\n✅ Dry run complete - No changes made');
    console.log('\nTo execute migration: node scripts/migrate-schedule-data.js --execute\n');
  } catch (error) {
    console.error('❌ Dry run failed:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// EXECUTE: Run the migration
// =============================================================================
async function execute() {
  console.log('\n🚀 EXECUTING MIGRATION - This will modify data...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251015000000_migrate_scheduled_tasks_to_time_blocks.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration SQL file not found:', migrationPath);
      console.error('   Please ensure the migration file exists.');
      process.exit(1);
    }

    console.log('⚠️  This will run the SQL migration file.');
    console.log('   File:', migrationPath);
    console.log('\n⚠️  WARNING: This operation cannot be undone through this script.');
    console.log('   Please use Supabase CLI or SQL editor to execute the migration:');
    console.log(`\n   supabase migration up\n`);
    console.log('   OR use the Supabase SQL Editor to run the migration file manually.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// ROLLBACK: Undo the migration
// =============================================================================
async function rollback() {
  console.log('\n⏪ ROLLING BACK MIGRATION...\n');

  try {
    // Delete migrated time blocks
    const { data, error } = await supabase
      .from('task_time_blocks')
      .delete()
      .eq('notes', 'Migrated from tasks.scheduled_date/scheduled_time')
      .select();

    if (error) throw error;

    console.log(`✅ Rolled back ${data.length} migrated time blocks`);

    // Verify rollback
    const { count, error: verifyError } = await supabase
      .from('task_time_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('notes', 'Migrated from tasks.scheduled_date/scheduled_time');

    if (verifyError) throw verifyError;

    console.log(`\n📊 Remaining migrated blocks: ${count || 0} (should be 0)`);

    if (count === 0) {
      console.log('\n✅ Rollback successful - All migrated blocks removed');
      console.log('\nOriginal scheduled_date/scheduled_time data remains intact in tasks table.');
      console.log('You can re-run the migration if needed.\n');
    } else {
      console.warn('\n⚠️  WARNING: Some migrated blocks remain. Manual investigation required.\n');
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// VERIFY: Check migration integrity
// =============================================================================
async function verify() {
  console.log('\n🔍 VERIFYING MIGRATION...\n');

  try {
    // 1. Count comparison
    const { count: tasksCount, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .not('scheduled_date', 'is', null);

    if (tasksError) throw tasksError;

    const { count: blocksCount, error: blocksError } = await supabase
      .from('task_time_blocks')
      .select('*', { count: 'exact', head: true });

    if (blocksError) throw blocksError;

    console.log(`📊 Tasks with scheduled_date: ${tasksCount || 0}`);
    console.log(`📊 Total time blocks: ${blocksCount || 0}`);

    // 2. Check for missed tasks
    const { data: missedTasks, error: missedError } = await supabase
      .rpc('check_missed_scheduled_tasks');

    if (missedError && missedError.code !== 'PGRST202') {
      // PGRST202 = function not found, which is okay
      console.warn('⚠️  Could not check for missed tasks (function not available)');
    }

    // 3. Check for orphaned blocks (blocks without tasks)
    const { data: orphanedBlocks, error: orphanError } = await supabase
      .from('task_time_blocks')
      .select(`
        id,
        task_id,
        tasks!inner(id)
      `)
      .is('tasks.id', null);

    if (orphanError) {
      console.warn('⚠️  Could not check for orphaned blocks:', orphanError.message);
    } else if (orphanedBlocks && orphanedBlocks.length > 0) {
      console.error(`\n❌ Found ${orphanedBlocks.length} orphaned time blocks!`);
      console.error('   (Time blocks without corresponding tasks)\n');
    } else {
      console.log('✅ No orphaned time blocks found');
    }

    // 4. Sample migrated data
    const { data: sampleBlocks, error: sampleError } = await supabase
      .from('task_time_blocks')
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        status,
        tasks!inner(task_name, scheduled_date, scheduled_time)
      `)
      .eq('notes', 'Migrated from tasks.scheduled_date/scheduled_time')
      .limit(5);

    if (sampleError) throw sampleError;

    if (sampleBlocks && sampleBlocks.length > 0) {
      console.log('\n📄 Sample migrated time blocks:\n');
      sampleBlocks.forEach(block => {
        console.log(`   • ${block.tasks.task_name}`);
        console.log(`     Date: ${block.scheduled_date}, Time: ${block.start_time} - ${block.end_time}`);
        console.log(`     Status: ${block.status}`);
      });
    }

    console.log('\n✅ Verification complete\n');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  if (!command) {
    console.log(`
Schedule Data Migration Script
Story 6.1: Migrate scheduled tasks to time blocks

Usage:
  node scripts/migrate-schedule-data.js --dry-run   Preview migration
  node scripts/migrate-schedule-data.js --execute   Execute migration
  node scripts/migrate-schedule-data.js --rollback  Rollback migration
  node scripts/migrate-schedule-data.js --verify    Verify migration
    `);
    process.exit(0);
  }

  switch (command) {
    case '--dry-run':
      await dryRun();
      break;
    case '--execute':
      await execute();
      break;
    case '--rollback':
      await rollback();
      break;
    case '--verify':
      await verify();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('   Valid commands: --dry-run, --execute, --rollback, --verify');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});