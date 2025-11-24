-- Create tenant schemas
-- This migration creates separate schemas for each tenant to ensure data isolation

-- Platform tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_platform;

-- Analytics tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_analytics;

-- Data tenant schema
CREATE SCHEMA IF NOT EXISTS tenant_data;

-- Create tenant metadata table (in public schema)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    namespace VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert tenant metadata
INSERT INTO tenants (tenant_id, name, namespace) VALUES
    ('platform', 'Platform Team', 'platform'),
    ('analytics', 'Analytics Team', 'analytics'),
    ('data', 'Data Team', 'data')
ON CONFLICT (tenant_id) DO NOTHING;

