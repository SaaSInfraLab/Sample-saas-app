-- Create users table in each tenant schema
-- This ensures complete data isolation per tenant

-- Function to create users table in a schema
CREATE OR REPLACE FUNCTION create_users_table(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            tenant_id VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON %I.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON %I.users(tenant_id);
    ', schema_name, schema_name);
END;
$$ LANGUAGE plpgsql;

-- Create users table in each tenant schema
SELECT create_users_table('tenant_platform');
SELECT create_users_table('tenant_analytics');
SELECT create_users_table('tenant_data');

-- Drop the helper function
DROP FUNCTION IF EXISTS create_users_table(TEXT);

