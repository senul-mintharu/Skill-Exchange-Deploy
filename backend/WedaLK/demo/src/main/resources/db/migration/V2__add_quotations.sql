-- =================================================================================================
-- LankaFIX V2 Database Schema
-- Sprint 2: Quotations Module
-- =================================================================================================

-- 1. Quotations Table
-- Linked to Service Requests and Users (Worker).
-- Enforces one quote per worker per request via unique constraint.
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    estimated_days INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quotation_request_worker UNIQUE (request_id, worker_id)
);

-- Note: ON DELETE CASCADE on request_id and worker_id ensures that if a request 
-- or a user is deleted, their associated quotations are also cleaned up.
