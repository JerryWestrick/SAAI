import click
import json
from saai_cli.db import query, execute


@click.group()
def saai():
    """SAAI - AI-Assisted Structured Analysis CLI"""
    pass


# --- Project commands ---

@saai.group()
def project():
    """Manage projects"""
    pass


@project.command("create")
@click.argument("name")
@click.option("--description", "-d", default="", help="Project description")
def project_create(name, description):
    """Create a new project"""
    row = execute(
        "INSERT INTO projects (name, description) VALUES (%s, %s) RETURNING *",
        (name, description),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@project.command("list")
def project_list():
    """List all projects"""
    rows = query("SELECT * FROM projects ORDER BY id")
    for row in rows:
        click.echo(f"  {row['id']}: {row['name']}")


# --- Diagram commands ---

@saai.group()
def diagram():
    """Manage diagrams"""
    pass


@diagram.command("create")
@click.option("--project", "-p", "project_id", required=True, type=int, help="Project ID")
@click.argument("name")
@click.option("--parent-node", "-n", "parent_node_id", type=int, default=None, help="Parent node ID")
@click.option("--level", "-l", type=int, default=0, help="DFD level")
def diagram_create(project_id, name, parent_node_id, level):
    """Create a new diagram"""
    row = execute(
        "INSERT INTO diagrams (project_id, parent_node_id, name, level) VALUES (%s, %s, %s, %s) RETURNING *",
        (project_id, parent_node_id, name, level),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@diagram.command("list")
@click.option("--project", "-p", "project_id", type=int, default=None, help="Filter by project")
def diagram_list(project_id):
    """List diagrams"""
    if project_id:
        rows = query("SELECT * FROM diagrams WHERE project_id = %s ORDER BY id", (project_id,))
    else:
        rows = query("SELECT * FROM diagrams ORDER BY id")
    for row in rows:
        click.echo(f"  {row['id']}: [{row['level']}] {row['name']} (project {row['project_id']})")


# --- Node commands ---

@saai.group()
def node():
    """Manage nodes (processes, external entities, data stores)"""
    pass


@node.command("add")
@click.option("--diagram", "-d", "diagram_id", required=True, type=int, help="Diagram ID")
@click.option("--type", "-t", "node_type", required=True,
              type=click.Choice(["process", "external_entity", "data_store"]), help="Node type")
@click.argument("name")
@click.option("--number", "-n", default=None, help="Node number (e.g. '1', '1.1', 'D1')")
@click.option("--x", type=float, default=0, help="X position")
@click.option("--y", type=float, default=0, help="Y position")
def node_add(diagram_id, node_type, name, number, x, y):
    """Add a node to a diagram"""
    row = execute(
        "INSERT INTO nodes (diagram_id, node_type, name, number, x, y) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
        (diagram_id, node_type, name, number, x, y),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@node.command("move")
@click.option("--id", "node_id", required=True, type=int, help="Node ID")
@click.option("--x", type=float, required=True, help="New X position")
@click.option("--y", type=float, required=True, help="New Y position")
def node_move(node_id, x, y):
    """Move a node to a new position"""
    row = execute(
        "UPDATE nodes SET x = %s, y = %s WHERE id = %s RETURNING *",
        (x, y, node_id),
    )
    if row:
        click.echo(json.dumps(row, indent=2, default=str))
    else:
        click.echo(f"Node {node_id} not found", err=True)


@node.command("list")
@click.option("--diagram", "-d", "diagram_id", type=int, default=None, help="Filter by diagram")
def node_list(diagram_id):
    """List nodes"""
    if diagram_id:
        rows = query("SELECT * FROM nodes WHERE diagram_id = %s ORDER BY id", (diagram_id,))
    else:
        rows = query("SELECT * FROM nodes ORDER BY id")
    for row in rows:
        click.echo(f"  {row['id']}: [{row['node_type']}] {row['number'] or '-'} {row['name']} @ ({row['x']}, {row['y']})")


# --- Flow commands ---

@saai.group()
def flow():
    """Manage data flows"""
    pass


@flow.command("add")
@click.option("--diagram", "-d", "diagram_id", required=True, type=int, help="Diagram ID")
@click.argument("name")
@click.option("--source", "-s", "source_id", required=True, type=int, help="Source node ID")
@click.option("--target", "-t", "target_id", required=True, type=int, help="Target node ID")
@click.option("--as-of", default=None, help="Currency requirement")
@click.option("--description", default=None, help="Flow description")
def flow_add(diagram_id, name, source_id, target_id, as_of, description):
    """Add a data flow between nodes"""
    row = execute(
        "INSERT INTO data_flows (diagram_id, name, source_id, target_id, as_of, description) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
        (diagram_id, name, source_id, target_id, as_of, description),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@flow.command("list")
@click.option("--diagram", "-d", "diagram_id", type=int, default=None, help="Filter by diagram")
def flow_list(diagram_id):
    """List data flows"""
    if diagram_id:
        rows = query("SELECT * FROM data_flows WHERE diagram_id = %s ORDER BY id", (diagram_id,))
    else:
        rows = query("SELECT * FROM data_flows ORDER BY id")
    for row in rows:
        as_of = f" [as-of: {row['as_of']}]" if row['as_of'] else ""
        click.echo(f"  {row['id']}: {row['name']} ({row['source_id']} -> {row['target_id']}){as_of}")


# --- Data Dictionary commands ---

@saai.group()
def dd():
    """Manage data dictionary"""
    pass


@dd.command("add")
@click.option("--project", "-p", "project_id", required=True, type=int, help="Project ID")
@click.argument("name")
@click.option("--definition", "-def", "definition", required=True, help="DD definition (e.g. '= customer_id + amount')")
@click.option("--description", "-d", default=None, help="Description")
def dd_add(project_id, name, definition, description):
    """Add a data dictionary entry"""
    row = execute(
        "INSERT INTO data_dictionary (project_id, name, definition, description) "
        "VALUES (%s, %s, %s, %s) RETURNING *",
        (project_id, name, definition, description),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@dd.command("list")
@click.option("--project", "-p", "project_id", type=int, default=None, help="Filter by project")
def dd_list(project_id):
    """List data dictionary entries"""
    if project_id:
        rows = query("SELECT * FROM data_dictionary WHERE project_id = %s ORDER BY name", (project_id,))
    else:
        rows = query("SELECT * FROM data_dictionary ORDER BY name")
    for row in rows:
        click.echo(f"  {row['name']} {row['definition']}")


# --- Trait commands ---

@saai.group()
def trait():
    """Manage project traits"""
    pass


@trait.command("add")
@click.option("--project", "-p", "project_id", required=True, type=int, help="Project ID")
@click.argument("name")
@click.option("--description", "-d", default=None, help="Trait description")
@click.option("--stale", is_flag=True, default=False, help="Can this trait go stale?")
def trait_add(project_id, name, description, stale):
    """Add a trait to a project"""
    row = execute(
        "INSERT INTO traits (project_id, name, description, can_go_stale) "
        "VALUES (%s, %s, %s, %s) RETURNING *",
        (project_id, name, description, stale),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@trait.command("list")
@click.option("--project", "-p", "project_id", type=int, default=None, help="Filter by project")
def trait_list(project_id):
    """List traits"""
    if project_id:
        rows = query("SELECT * FROM traits WHERE project_id = %s ORDER BY id", (project_id,))
    else:
        rows = query("SELECT * FROM traits ORDER BY id")
    for row in rows:
        stale = " (can go stale)" if row['can_go_stale'] else ""
        click.echo(f"  {row['id']}: {row['name']}{stale}")
        if row['description']:
            click.echo(f"      {row['description']}")


# --- DD Field commands ---

@saai.group()
def field():
    """Manage data dictionary fields"""
    pass


@field.command("add")
@click.option("--dd", "dd_id", required=True, type=int, help="Data dictionary entry ID")
@click.argument("name")
@click.option("--type", "-t", "field_type", default="text",
              type=click.Choice(["text", "integer", "float", "boolean", "date", "reference"]),
              help="Field type")
@click.option("--ref", "reference_dd", default=None, help="Referenced DD entry name (for reference type)")
@click.option("--description", "-d", default=None, help="Field description")
@click.option("--sort", "sort_order", type=int, default=0, help="Sort order")
def field_add(dd_id, name, field_type, reference_dd, description, sort_order):
    """Add a field to a data dictionary entry"""
    row = execute(
        "INSERT INTO dd_fields (dd_id, name, field_type, reference_dd, description, sort_order) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
        (dd_id, name, field_type, reference_dd, description, sort_order),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@field.command("list")
@click.option("--dd", "dd_id", type=int, default=None, help="Filter by DD entry ID")
def field_list(dd_id):
    """List data dictionary fields"""
    if dd_id:
        rows = query(
            "SELECT f.*, d.name as dd_name FROM dd_fields f "
            "JOIN data_dictionary d ON f.dd_id = d.id "
            "WHERE f.dd_id = %s ORDER BY f.sort_order", (dd_id,))
    else:
        rows = query(
            "SELECT f.*, d.name as dd_name FROM dd_fields f "
            "JOIN data_dictionary d ON f.dd_id = d.id "
            "ORDER BY d.name, f.sort_order")
    current_dd = None
    for row in rows:
        if row['dd_name'] != current_dd:
            current_dd = row['dd_name']
            click.echo(f"\n  {current_dd}:")
        ref = f" -> {row['reference_dd']}" if row['reference_dd'] else ""
        desc = f" — {row['description']}" if row['description'] else ""
        click.echo(f"    {row['name']} ({row['field_type']}{ref}){desc}")


# --- Flow Trait commands ---

@saai.group(name="flow-trait")
def flow_trait():
    """Manage traits on data flows"""
    pass


@flow_trait.command("add")
@click.option("--flow", "-f", "flow_id", required=True, type=int, help="Data flow ID")
@click.option("--trait", "-t", "trait_id", required=True, type=int, help="Trait ID")
@click.option("--modifier", "-m", required=True,
              type=click.Choice(["requires", "adds", "removes"]), help="Trait modifier")
def flow_trait_add(flow_id, trait_id, modifier):
    """Add a trait annotation to a data flow"""
    row = execute(
        "INSERT INTO flow_traits (flow_id, trait_id, modifier) "
        "VALUES (%s, %s, %s) RETURNING *",
        (flow_id, trait_id, modifier),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@flow_trait.command("list")
@click.option("--flow", "-f", "flow_id", type=int, default=None, help="Filter by flow ID")
def flow_trait_list(flow_id):
    """List flow trait annotations"""
    if flow_id:
        rows = query(
            "SELECT ft.*, t.name as trait_name, df.name as flow_name "
            "FROM flow_traits ft "
            "JOIN traits t ON ft.trait_id = t.id "
            "JOIN data_flows df ON ft.flow_id = df.id "
            "WHERE ft.flow_id = %s ORDER BY ft.id", (flow_id,))
    else:
        rows = query(
            "SELECT ft.*, t.name as trait_name, df.name as flow_name "
            "FROM flow_traits ft "
            "JOIN traits t ON ft.trait_id = t.id "
            "JOIN data_flows df ON ft.flow_id = df.id "
            "ORDER BY ft.flow_id, ft.id")
    for row in rows:
        click.echo(f"  {row['flow_name']}: {row['modifier']} {row['trait_name']}")


# --- Mini Spec commands ---

@saai.group()
def minispec():
    """Manage mini specifications"""
    pass


@minispec.command("set")
@click.option("--node", "-n", "node_id", required=True, type=int, help="Node ID")
@click.option("--text", "-t", "spec_text", required=True, help="Mini spec text")
@click.option("--prompt-file", "-f", default=None, help="Path to .prompt file")
def minispec_set(node_id, spec_text, prompt_file):
    """Set or update a mini spec for a node"""
    row = execute(
        "INSERT INTO mini_specs (node_id, spec_text, prompt_file) VALUES (%s, %s, %s) "
        "ON CONFLICT (node_id) DO UPDATE SET spec_text = EXCLUDED.spec_text, prompt_file = EXCLUDED.prompt_file "
        "RETURNING *",
        (node_id, spec_text, prompt_file),
    )
    click.echo(json.dumps(row, indent=2, default=str))


@minispec.command("show")
@click.option("--node", "-n", "node_id", required=True, type=int, help="Node ID")
def minispec_show(node_id):
    """Show mini spec for a node"""
    rows = query("SELECT * FROM mini_specs WHERE node_id = %s", (node_id,))
    if rows:
        click.echo(rows[0]['spec_text'])
        if rows[0]['prompt_file']:
            click.echo(f"\nPrompt file: {rows[0]['prompt_file']}")
    else:
        click.echo(f"No mini spec for node {node_id}", err=True)


if __name__ == "__main__":
    saai()
