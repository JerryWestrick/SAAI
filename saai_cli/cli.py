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
