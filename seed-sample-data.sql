-- Seed sample data for testing Business Dashboard and Tasks Hub
-- Run this in Supabase SQL Editor to create test businesses, projects, phases
-- Replace 'YOUR_USER_ID' with your actual user_id: cbdd0170-5c6b-429c-9a8f-f3ba4e46405c

-- Clear existing test data before re-seeding
DELETE FROM tasks WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c' AND business_id IS NOT NULL;
DELETE FROM phases WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c';
DELETE FROM projects WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c';
DELETE FROM businesses WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c';

-- Insert sample businesses
INSERT INTO businesses (id, user_id, name, slug, color, description) VALUES
('11111111-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Full Stack AI', 'fullstack-ai', '#4d7c5e', 'Custom software development'),
('22222222-2222-2222-2222-222222222222', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Huge Capital', 'huge-capital', '#a855f7', 'Marketing agency'),
('33333333-3333-3333-3333-333333333333', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'S4', 's4', '#3b82f6', 'Data analytics platform'),
('44444444-4444-4444-4444-444444444444', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '808', '808', '#eab308', 'E-commerce fulfillment'),
('55555555-5555-5555-5555-555555555555', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Service SaaS', 'service-saas', '#ef4444', 'SaaS platform')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, user_id, business_id, name, description, status) VALUES
-- Full Stack projects
('a1111111-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '11111111-1111-1111-1111-111111111111', 'Client Portal v2', 'Rebuild client dashboard', 'active'),
('a1111112-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '11111111-1111-1111-1111-111111111111', 'Mobile App Launch', 'iOS and Android app', 'active'),

-- Huge Capital projects
('a2222221-2222-2222-2222-222222222222', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '22222222-2222-2222-2222-222222222222', 'Q1 Marketing Campaign', 'Launch new product line', 'active'),

-- S4 projects
('a3333331-3333-3333-3333-333333333333', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '33333333-3333-3333-3333-333333333333', 'Analytics Dashboard', 'Real-time metrics dashboard', 'active'),

-- 808 projects
('a4444441-4444-4444-4444-444444444444', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '44444444-4444-4444-4444-444444444444', 'Warehouse Automation', 'Automate fulfillment', 'active'),

-- Service SaaS projects
('a5555551-5555-5555-5555-555555555555', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', '55555555-5555-5555-5555-555555555555', 'Platform Launch', 'Launch beta version', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample phases
INSERT INTO phases (id, user_id, project_id, name, description, status, sequence_order) VALUES
-- Client Portal v2 phases
('c1111111-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a1111111-1111-1111-1111-111111111111', 'Design', 'UI/UX design phase', 'active', 1),
('c1111112-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a1111111-1111-1111-1111-111111111111', 'Development', 'Build features', 'active', 2),
('c1111113-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a1111111-1111-1111-1111-111111111111', 'Testing & QA', 'Quality assurance', 'active', 3),

-- Mobile App Launch phases
('c1111121-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a1111112-1111-1111-1111-111111111111', 'Planning', 'Requirements gathering', 'completed', 1),
('c1111122-1111-1111-1111-111111111111', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a1111112-1111-1111-1111-111111111111', 'MVP Development', 'Build core features', 'active', 2),

-- Q1 Marketing Campaign phases
('c2222221-2222-2222-2222-222222222222', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a2222221-2222-2222-2222-222222222222', 'Strategy', 'Campaign planning', 'completed', 1),
('c2222222-2222-2222-2222-222222222222', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a2222221-2222-2222-2222-222222222222', 'Execution', 'Launch campaign', 'active', 2),

-- Analytics Dashboard phases
('c3333331-3333-3333-3333-333333333333', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a3333331-3333-3333-3333-333333333333', 'Data Pipeline', 'Build ETL pipeline', 'active', 1),
('c3333332-3333-3333-3333-333333333333', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a3333331-3333-3333-3333-333333333333', 'Visualization', 'Create charts', 'active', 2),

-- Warehouse Automation phases
('c4444441-4444-4444-4444-444444444444', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a4444441-4444-4444-4444-444444444444', 'Assessment', 'Audit current process', 'completed', 1),
('c4444442-4444-4444-4444-444444444444', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a4444441-4444-4444-4444-444444444444', 'Implementation', 'Deploy automation', 'active', 2),

-- Platform Launch phases
('c5555551-5555-5555-5555-555555555555', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a5555551-5555-5555-5555-555555555555', 'Development', 'Build core platform', 'active', 1),
('c5555552-5555-5555-5555-555555555555', 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'a5555551-5555-5555-5555-555555555555', 'Beta Testing', 'User testing and feedback', 'active', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks for each phase
INSERT INTO tasks (user_id, task_name, description, business_id, project_id, phase_id, status, priority, due_date) VALUES
-- Client Portal v2 > Design
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Create wireframes', 'Design low-fi wireframes for all pages', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Done', 'High', '2025-10-05'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Design system components', 'Build component library in Figma', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'In progress', 'High', '2025-10-10'),

-- Client Portal v2 > Development
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Setup React project', 'Initialize React + TypeScript project', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111112-1111-1111-1111-111111111111', 'Done', 'High', '2025-10-01'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Build auth flow', 'Implement login/signup with Supabase', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111112-1111-1111-1111-111111111111', 'In progress', 'High', '2025-10-12'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Dashboard page', 'Create main dashboard with metrics', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111112-1111-1111-1111-111111111111', 'Not started', 'Medium', '2025-10-15'),

-- Mobile App > MVP Development
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Setup React Native', 'Initialize RN project with Expo', '11111111-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111', 'c1111122-1111-1111-1111-111111111111', 'Done', 'High', '2025-10-02'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Build home screen', 'Create main navigation and home', '11111111-1111-1111-1111-111111111111', 'a1111112-1111-1111-1111-111111111111', 'c1111122-1111-1111-1111-111111111111', 'In progress', 'High', '2025-10-11'),

-- Q1 Marketing > Execution
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Launch social media ads', 'Deploy Facebook and Instagram ads', '22222222-2222-2222-2222-222222222222', 'a2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'In progress', 'High', '2025-10-09'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Email campaign', 'Send newsletter to 10k subscribers', '22222222-2222-2222-2222-222222222222', 'a2222221-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Not started', 'Medium', '2025-10-13'),

-- Analytics Dashboard > Data Pipeline
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Setup Airbyte connectors', 'Connect data sources', '33333333-3333-3333-3333-333333333333', 'a3333331-3333-3333-3333-333333333333', 'c3333331-3333-3333-3333-333333333333', 'In progress', 'High', '2025-10-10'),

-- Warehouse Automation > Implementation
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Install conveyor system', 'Deploy automated conveyor belts', '44444444-4444-4444-4444-444444444444', 'a4444441-4444-4444-4444-444444444444', 'c4444442-4444-4444-4444-444444444444', 'Not started', 'High', '2025-10-20'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Train staff', 'Onboard team on new system', '44444444-4444-4444-4444-444444444444', 'a4444441-4444-4444-4444-444444444444', 'c4444442-4444-4444-4444-444444444444', 'Not started', 'Medium', '2025-10-25'),

-- Platform Launch > Development
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Design API architecture', 'Plan REST API endpoints', '55555555-5555-5555-5555-555555555555', 'a5555551-5555-5555-5555-555555555555', 'c5555551-5555-5555-5555-555555555555', 'In progress', 'High', '2025-10-14'),
('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Build core features', 'Implement main platform features', '55555555-5555-5555-5555-555555555555', 'a5555551-5555-5555-5555-555555555555', 'c5555551-5555-5555-5555-555555555555', 'Not started', 'High', '2025-10-22');

-- Verify data was inserted
SELECT 'Businesses' as table_name, COUNT(*) as count FROM businesses WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
UNION ALL
SELECT 'Phases', COUNT(*) FROM phases WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
UNION ALL
SELECT 'Tasks (Business)', COUNT(*) FROM tasks WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c' AND business_id IS NOT NULL;
