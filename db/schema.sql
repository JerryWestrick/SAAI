-- SA Database Schema
-- Structured Analysis - AI Assisted

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagrams (each level in the DFD hierarchy)
CREATE TABLE diagrams (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_node_id INTEGER,  -- FK added after nodes table exists
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0
);

-- Nodes (processes, external entities, data stores)
CREATE TABLE nodes (
    id SERIAL PRIMARY KEY,
    diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('process', 'external_entity', 'data_store')),
    name TEXT NOT NULL,
    number TEXT,
    x FLOAT NOT NULL DEFAULT 0,
    y FLOAT NOT NULL DEFAULT 0,
    child_diagram_id INTEGER REFERENCES diagrams(id) ON DELETE SET NULL
);

-- Now add the FK from diagrams to nodes
ALTER TABLE diagrams
    ADD CONSTRAINT fk_diagrams_parent_node
    FOREIGN KEY (parent_node_id) REFERENCES nodes(id) ON DELETE SET NULL;

-- Data flows (arrows connecting nodes)
CREATE TABLE data_flows (
    id SERIAL PRIMARY KEY,
    diagram_id INTEGER NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    as_of TEXT,
    description TEXT
);

-- Data dictionary (project-level)
CREATE TABLE data_dictionary (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    definition TEXT NOT NULL,
    description TEXT,
    UNIQUE(project_id, name)
);

-- Mini specs (one per leaf process)
CREATE TABLE mini_specs (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL UNIQUE REFERENCES nodes(id) ON DELETE CASCADE,
    spec_text TEXT NOT NULL,
    prompt_file TEXT
);

-- Structured fields for data dictionary entries
CREATE TABLE dd_fields (
    id SERIAL PRIMARY KEY,
    dd_id INTEGER NOT NULL REFERENCES data_dictionary(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',  -- text, integer, float, boolean, date, reference
    reference_dd TEXT,  -- if field_type='reference', name of referenced DD entry
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Project-level trait definitions
CREATE TABLE traits (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    can_go_stale BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(project_id, name)
);

-- Traits on data flows (requires/adds/removes)
CREATE TABLE flow_traits (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES data_flows(id) ON DELETE CASCADE,
    trait_id INTEGER NOT NULL REFERENCES traits(id) ON DELETE CASCADE,
    modifier TEXT NOT NULL CHECK (modifier IN ('requires', 'adds', 'removes')),
    UNIQUE(flow_id, trait_id, modifier)
);
