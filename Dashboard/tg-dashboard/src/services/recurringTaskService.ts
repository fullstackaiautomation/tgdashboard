import { supabase } from '../lib/supabase';
import type { TaskHub, RecurringType, CreateTaskDTO } from '../types/task';

/**
 * Generate future instances of a recurring task
 * @param parentTask - The parent recurring task
 * @param daysAhead - Number of days to generate instances for (default: 30)
 */
export async function generateRecurringInstances(
  parentTask: TaskHub,
  daysAhead: number = 30
): Promise<void> {
  if (!parentTask.recurring_type || parentTask.recurring_type === 'none') {
    return;
  }

  const instances: CreateTaskDTO[] = [];
  const today = new Date();

  // Start from "yesterday" so first call to getNextOccurrence() returns today
  // This handles the boundary correctly for all recurring types
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 1);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get the user_id from the parent task
  const userId = parentTask.user_id;

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Move to next occurrence FIRST (this ensures we start from today, not yesterday)
    currentDate = getNextOccurrence(
      currentDate,
      parentTask.recurring_type,
      parentTask.recurring_interval || 1
    );

    if (currentDate > endDate) break;

    // Format date as MM/DD/YY
    const dateStr = formatDate(currentDate);

    // Extract base task name (remove any existing date suffix)
    const baseName = parentTask.task_name.replace(/\s+\d{2}\/\d{2}\/\d{2}$/, '').trim();
    const taskNameWithDate = `${baseName} ${dateStr}`;

    // Format date as YYYY-MM-DD in local timezone (not UTC)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    // Create instance
    // Note: We don't copy business_id, project_id, or phase_id because:
    // 1. There's a unique constraint on phase_id that would prevent duplicates
    // 2. Recurring instances should be independent tasks, not tied to specific phases
    const instance: CreateTaskDTO = {
      task_name: taskNameWithDate,
      description: parentTask.description || undefined,
      status: 'Not started',
      priority: parentTask.priority,
      due_date: localDateStr, // Set due date to the occurrence date in local timezone
      effort_level: parentTask.effort_level || undefined,
      automation: parentTask.automation || undefined,
      hours_projected: parentTask.hours_projected || undefined,
      recurring_type: parentTask.recurring_type,
      recurring_interval: parentTask.recurring_interval,
      recurrence_parent_id: parentTask.id, // Link back to parent
    };

    instances.push(instance);
  }

  // Insert all instances into the database
  if (instances.length > 0) {
    const instancesWithUser = instances.map(inst => ({
      ...inst,
      user_id: userId,
    }));

    const { error } = await supabase
      .from('tasks')
      .insert(instancesWithUser);

    if (error) {
      console.error('Error creating recurring task instances:', error);
      throw error;
    }

    console.log(`✅ Generated ${instances.length} recurring task instances`);
  }
}

/**
 * Calculate the next occurrence date based on recurring_type and interval
 */
function getNextOccurrence(
  currentDate: Date,
  recurringType: RecurringType,
  interval: number
): Date {
  const next = new Date(currentDate);

  switch (recurringType) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      return next;

    case 'daily_weekdays':
      // Move to next weekday
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      return next;

    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      return next;

    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      return next;

    default:
      next.setDate(next.getDate() + 1);
      return next;
  }
}

/**
 * Format date as MM/DD/YY
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Check and generate missing recurring instances for all recurring tasks
 * This should be called on app initialization or periodically
 */
export async function ensureRecurringInstances(): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find all recurring tasks (parent templates only, not instances)
    const { data: recurringTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('recurring_type', 'is', null)
      .neq('recurring_type', 'none')
      .is('recurrence_parent_id', null); // Only get templates, not instances

    if (error) {
      console.error('Error fetching recurring tasks:', error);
      return;
    }

    if (!recurringTasks || recurringTasks.length === 0) {
      return;
    }

    console.log(`🔄 Checking ${recurringTasks.length} recurring tasks for missing instances...`);

    // For each recurring task, check if future instances exist
    for (const task of recurringTasks) {
      // Get today's date in local timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Check how many future instances exist
      const { data: existingInstances, error: countError } = await supabase
        .from('tasks')
        .select('id, due_date')
        .eq('recurrence_parent_id', task.id)
        .gte('due_date', todayStr);

      if (countError) {
        console.error('Error counting instances:', countError);
        continue;
      }

      // If less than 15 future instances, generate more
      if (!existingInstances || existingInstances.length < 15) {
        console.log(`📝 Generating instances for: ${task.task_name}`);
        await generateRecurringInstances(task as TaskHub, 30);
      }
    }

    console.log('✅ Recurring instances check complete');
  } catch (error) {
    console.error('Error in ensureRecurringInstances:', error);
  }
}
