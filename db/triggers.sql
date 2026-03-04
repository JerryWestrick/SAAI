-- SA NOTIFY Triggers
-- Every table change fires a notification on channel 'sa_changes'
-- Payload: {"table": "...", "action": "INSERT|UPDATE|DELETE", "row": {...}}

-- Generic notify function (reused by all tables)
CREATE OR REPLACE FUNCTION sa_notify() RETURNS trigger AS $$
DECLARE
    payload JSON;
    row_data JSON;
BEGIN
    IF TG_OP = 'DELETE' THEN
        row_data := row_to_json(OLD);
    ELSE
        row_data := row_to_json(NEW);
    END IF;

    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'row', row_data
    );

    PERFORM pg_notify('sa_changes', payload::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Diagrams trigger
DROP TRIGGER IF EXISTS diagrams_notify ON diagrams;
CREATE TRIGGER diagrams_notify
    AFTER INSERT OR UPDATE OR DELETE ON diagrams
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Projects trigger
DROP TRIGGER IF EXISTS projects_notify ON projects;
CREATE TRIGGER projects_notify
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Nodes trigger
DROP TRIGGER IF EXISTS nodes_notify ON nodes;
CREATE TRIGGER nodes_notify
    AFTER INSERT OR UPDATE OR DELETE ON nodes
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Data flows trigger
DROP TRIGGER IF EXISTS data_flows_notify ON data_flows;
CREATE TRIGGER data_flows_notify
    AFTER INSERT OR UPDATE OR DELETE ON data_flows
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Data dictionary trigger
DROP TRIGGER IF EXISTS data_dictionary_notify ON data_dictionary;
CREATE TRIGGER data_dictionary_notify
    AFTER INSERT OR UPDATE OR DELETE ON data_dictionary
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Mini specs trigger
DROP TRIGGER IF EXISTS mini_specs_notify ON mini_specs;
CREATE TRIGGER mini_specs_notify
    AFTER INSERT OR UPDATE OR DELETE ON mini_specs
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- DD fields trigger
DROP TRIGGER IF EXISTS dd_fields_notify ON dd_fields;
CREATE TRIGGER dd_fields_notify
    AFTER INSERT OR UPDATE OR DELETE ON dd_fields
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Traits trigger
DROP TRIGGER IF EXISTS traits_notify ON traits;
CREATE TRIGGER traits_notify
    AFTER INSERT OR UPDATE OR DELETE ON traits
    FOR EACH ROW EXECUTE FUNCTION sa_notify();

-- Flow traits trigger
DROP TRIGGER IF EXISTS flow_traits_notify ON flow_traits;
CREATE TRIGGER flow_traits_notify
    AFTER INSERT OR UPDATE OR DELETE ON flow_traits
    FOR EACH ROW EXECUTE FUNCTION sa_notify();
