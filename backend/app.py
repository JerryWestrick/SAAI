import asyncio
import json
import select

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path

from saai_cli.db import DB_CONFIG, get_conn, query, execute

app = FastAPI(title="SAAI - AI-Assisted Structured Analysis")

# Connected WebSocket clients
clients: set[WebSocket] = set()

TABLES = ["projects", "diagrams", "nodes", "data_flows", "data_dictionary", "mini_specs"]


@app.get("/api/tables")
def get_all_tables():
    """Return full contents of all tables"""
    result = {}
    for table in TABLES:
        result[table] = query(f"SELECT * FROM {table} ORDER BY id")
    return result


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        # Send full table dump on connect
        result = {}
        for table in TABLES:
            result[table] = query(f"SELECT * FROM {table} ORDER BY id")
        await ws.send_json({"type": "init", "data": result})

        # Keep connection alive, receive any client messages
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.discard(ws)


async def broadcast(message: dict):
    """Send a message to all connected clients"""
    global clients
    dead = set()
    for ws in clients:
        try:
            await ws.send_json(message)
        except Exception:
            dead.add(ws)
    clients -= dead


async def pg_listen():
    """Listen for PostgreSQL NOTIFY and broadcast to WebSocket clients"""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("LISTEN sa_changes;")

    while True:
        # Non-blocking poll for notifications
        if select.select([conn], [], [], 0.5) == ([], [], []):
            await asyncio.sleep(0.1)
            continue
        conn.poll()
        while conn.notifies:
            notify = conn.notifies.pop(0)
            payload = json.loads(notify.payload)
            await broadcast({"type": "change", "data": payload})


@app.on_event("startup")
async def startup():
    asyncio.create_task(pg_listen())


class PositionUpdate(BaseModel):
    x: float
    y: float


class NodePosition(BaseModel):
    id: int
    x: float
    y: float


class BatchPositionUpdate(BaseModel):
    positions: list[NodePosition]


@app.put("/api/nodes/positions")
def batch_update_node_positions(batch: BatchPositionUpdate):
    """Update multiple node positions in one transaction"""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        results = []
        for pos in batch.positions:
            cur.execute(
                "UPDATE nodes SET x = %s, y = %s WHERE id = %s RETURNING id, x, y",
                (pos.x, pos.y, pos.id),
            )
            row = cur.fetchone()
            if row:
                results.append(dict(row))
        conn.commit()
        return results
    finally:
        conn.close()


@app.put("/api/nodes/{node_id}/position")
def update_node_position(node_id: int, pos: PositionUpdate):
    """Update a node's x/y position (triggers NOTIFY via DB trigger)"""
    result = execute(
        "UPDATE nodes SET x = %s, y = %s WHERE id = %s RETURNING id, x, y",
        (pos.x, pos.y, node_id),
    )
    if not result:
        return {"error": "Node not found"}, 404
    return result


@app.get("/tables", response_class=HTMLResponse)
def tables_view():
    """Serve the debug tables view"""
    return Path(__file__).parent.parent.joinpath("frontend", "tables.html").read_text()


# Serve built React app (production) or fallback index.html
dist_dir = Path(__file__).parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")


@app.get("/", response_class=HTMLResponse)
def index():
    # In production, serve the built React app; otherwise fall back to dev index.html
    built = Path(__file__).parent.parent / "frontend" / "dist" / "index.html"
    if built.exists():
        return built.read_text()
    return Path(__file__).parent.parent.joinpath("frontend", "index.html").read_text()
