-- Create tasks table in each tenant schema
-- This ensures complete data isolation per tenant

-- Function to create tasks table in a schema
CREATE OR REPLACE FUNCTION create_tasks_table(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT ''todo'' CHECK (status IN (''todo'', ''in_progress'', ''done'')),
            assignee VARCHAR(255),
            due_date DATE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_status ON %I.tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON %I.tasks(created_by);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON %I.tasks(due_date);
    ', schema_name, schema_name);
END;
$$ LANGUAGE plpgsql;

-- Create tasks table in each tenant schema
SELECT create_tasks_table('tenant_platform');
SELECT create_tasks_table('tenant_analytics');
SELECT create_tasks_table('tenant_data');

-- Drop the helper function
DROP FUNCTION IF EXISTS create_tasks_table(TEXT);

