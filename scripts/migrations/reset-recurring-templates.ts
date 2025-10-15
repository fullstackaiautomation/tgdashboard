import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rnlijzolilwweptwbakv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetRecurringTemplates() {
  console.log('Resetting all recurring template tasks...');

  const { data, error } = await supabase
    .from('tasks')
    .update({
      progress_percentage: 0,
      status: 'Not started',
      completed_at: null,
    })
    .not('recurring_type', 'is', null)
    .neq('recurring_type', 'none')
    .is('recurrence_parent_id', null)
    .select();

  if (error) {
    console.error('Error resetting templates:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully reset ${data?.length || 0} recurring template tasks`);
  console.log('Templates reset:', data?.map(t => t.task_name).join(', '));
}

resetRecurringTemplates();
