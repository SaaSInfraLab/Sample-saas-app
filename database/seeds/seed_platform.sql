-- Seed data for platform tenant
-- This is optional and can be used for testing/demo purposes

-- Set search path to platform tenant schema
SET search_path TO tenant_platform;

-- Insert sample users (passwords are 'password123' hashed with bcrypt)
-- Seed data for development/testing
INSERT INTO users (email, password_hash, name, tenant_id) VALUES
    ('admin@platform.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZ', 'Platform Admin', 'platform'),
    ('user@platform.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZ', 'Platform User', 'platform')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, assignee, created_by) VALUES
    ('Setup CI/CD Pipeline', 'Configure GitHub Actions for automated deployments', 'in_progress', 'admin@platform.com', 1),
    ('Implement Monitoring', 'Set up Prometheus and Grafana dashboards', 'todo', 'user@platform.com', 1),
    ('Database Backup Strategy', 'Implement automated backup and recovery', 'todo', NULL, 1)
ON CONFLICT DO NOTHING;

-- Reset search path
RESET search_path;

