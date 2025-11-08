import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RecurringTask {
  id: string;
  task_name: string;
  recurring_type: "daily_weekdays" | "weekly" | "biweekly" | "monthly" | null;
  recurring_interval: number | null;
  description?: string;
  effort_level?: string;
  automation?: string;
  hours_projected?: number;
  business_id?: string;
  project_id?: string;
  phase_id?: string;
}

const formatDateForTask = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

const getCurrentWeekSunday = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Use service role key for database operations (has full access)
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get current week dates (the week to generate tasks for)
    const today = new Date();
    const weekSunday = getCurrentWeekSunday(today);
    // For the scheduled job: generate for the current week
    // (This will be called weekly, so it generates fresh tasks for the current week)
    const nextWeekSunday = new Date(weekSunday);
    nextWeekSunday.setDate(nextWeekSunday.getDate() + 7);

    // Query tasks that have recurring_type set
    const { data: recurringTasks, error: queryError } = await supabase
      .from("tasks_hub")
      .select("*")
      .not("recurring_type", "is", null)
      .not("recurring_type", "eq", "null");

    if (queryError) {
      console.error("Error querying recurring tasks:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query recurring tasks" }),
        { status: 500 }
      );
    }

    const tasksCreated: string[] = [];

    // Generate new instances for each recurring task
    for (const task of recurringTasks as RecurringTask[]) {
      const baseTaskName = task.task_name;
      const newTasks = [];

      if (
        task.recurring_type === "daily_weekdays" ||
        task.recurring_type === "weekdays"
      ) {
        // Generate for M-F of next week
        for (let i = 1; i <= 5; i++) {
          const taskDate = new Date(nextWeekSunday);
          taskDate.setDate(taskDate.getDate() + i);

          // Remove date from original name if it exists (format: MM/DD/YY)
          const baseName = baseTaskName.replace(/ \d{2}\/\d{2}\/\d{2}$/, "");
          const dateString = formatDateForTask(taskDate);

          newTasks.push({
            task_name: `${baseName} ${dateString}`,
            description: task.description,
            status: "Not started",
            priority: "Medium",
            due_date: taskDate.toISOString(),
            effort_level: task.effort_level,
            automation: task.automation,
            hours_projected: task.hours_projected,
            business_id: task.business_id,
            project_id: task.project_id,
            phase_id: task.phase_id,
            recurring_type: task.recurring_type,
            recurring_interval: task.recurring_interval,
            recurring_parent_id: task.id, // Link to parent recurring task
          });
        }
      } else if (task.recurring_type === "weekly") {
        // Generate for Monday of next week
        const taskDate = new Date(nextWeekSunday);
        taskDate.setDate(taskDate.getDate() + 1);

        const baseName = baseTaskName.replace(/ \d{2}\/\d{2}\/\d{2}$/, "");
        const dateString = formatDateForTask(taskDate);

        newTasks.push({
          task_name: `${baseName} ${dateString}`,
          description: task.description,
          status: "Not started",
          priority: "Medium",
          due_date: taskDate.toISOString(),
          effort_level: task.effort_level,
          automation: task.automation,
          hours_projected: task.hours_projected,
          business_id: task.business_id,
          project_id: task.project_id,
          phase_id: task.phase_id,
          recurring_type: task.recurring_type,
          recurring_interval: task.recurring_interval,
          recurring_parent_id: task.id,
        });
      } else if (task.recurring_type === "biweekly") {
        // Only generate if it's the right week (every 2 weeks)
        // Simple approach: check if this task was created 14 days ago
        // For now, generate for Monday of next week if interval matches
        const taskDate = new Date(nextWeekSunday);
        taskDate.setDate(taskDate.getDate() + 1);

        const baseName = baseTaskName.replace(/ \d{2}\/\d{2}\/\d{2}$/, "");
        const dateString = formatDateForTask(taskDate);

        newTasks.push({
          task_name: `${baseName} ${dateString}`,
          description: task.description,
          status: "Not started",
          priority: "Medium",
          due_date: taskDate.toISOString(),
          effort_level: task.effort_level,
          automation: task.automation,
          hours_projected: task.hours_projected,
          business_id: task.business_id,
          project_id: task.project_id,
          phase_id: task.phase_id,
          recurring_type: task.recurring_type,
          recurring_interval: task.recurring_interval,
          recurring_parent_id: task.id,
        });
      } else if (task.recurring_type === "monthly") {
        // Generate for Monday of next week (monthly pattern)
        const taskDate = new Date(nextWeekSunday);
        taskDate.setDate(taskDate.getDate() + 1);

        const baseName = baseTaskName.replace(/ \d{2}\/\d{2}\/\d{2}$/, "");
        const dateString = formatDateForTask(taskDate);

        newTasks.push({
          task_name: `${baseName} ${dateString}`,
          description: task.description,
          status: "Not started",
          priority: "Medium",
          due_date: taskDate.toISOString(),
          effort_level: task.effort_level,
          automation: task.automation,
          hours_projected: task.hours_projected,
          business_id: task.business_id,
          project_id: task.project_id,
          phase_id: task.phase_id,
          recurring_type: task.recurring_type,
          recurring_interval: task.recurring_interval,
          recurring_parent_id: task.id,
        });
      }

      // Insert new tasks
      if (newTasks.length > 0) {
        const { data: insertedTasks, error: insertError } = await supabase
          .from("tasks_hub")
          .insert(newTasks);

        if (insertError) {
          console.error(
            `Error creating tasks for ${task.task_name}:`,
            insertError
          );
        } else {
          tasksCreated.push(
            ...newTasks.map((t) => `${t.task_name} (${t.due_date})`)
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasksCreated: tasksCreated.length,
        tasks: tasksCreated,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in generate-recurring-tasks:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
