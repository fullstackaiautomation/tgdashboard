-- Enable required extensions for cron job scheduling
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Create the cron job to call the generate-recurring-tasks Edge Function
-- Schedule: Every Monday at 12:00 AM UTC
-- This generates recurring task instances for the upcoming week
select cron.schedule(
  'generate_recurring_tasks_weekly',
  '0 0 * * 1', -- Monday at midnight UTC
  $$
    select
      net.http_post(
        url := 'https://rnlijzolilwweptwbakv.supabase.co/functions/v1/generate-recurring-tasks',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', 't')
        ),
        body := '{}',
        timeout_milliseconds := 30000
      ) as request_id;
  $$
);

-- Log the cron job details
-- SELECT 'Recurring tasks cron job scheduled' as status,
--        'Every Monday at 00:00 UTC' as schedule,
--        'generate_recurring_tasks_weekly' as job_name;