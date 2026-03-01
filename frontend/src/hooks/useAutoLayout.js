import dagre from '@dagrejs/dagre'

const NODE_SIZES = {
  process: { width: 160, height: 160 },
  external_entity: { width: 140, height: 50 },
  data_store: { width: 160, height: 44 },
}

export function computeLayout(dbNodes, dbFlows) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 })

  for (const node of dbNodes) {
    const size = NODE_SIZES[node.node_type] || NODE_SIZES.process
    g.setNode(String(node.id), { width: size.width, height: size.height })
  }

  for (const flow of dbFlows) {
    g.setEdge(String(flow.source_id), String(flow.target_id))
  }

  dagre.layout(g)

  return dbNodes.map(node => {
    const pos = g.node(String(node.id))
    const size = NODE_SIZES[node.node_type] || NODE_SIZES.process
    return {
      id: node.id,
      x: pos.x - size.width / 2,
      y: pos.y - size.height / 2,
    }
  })
}
