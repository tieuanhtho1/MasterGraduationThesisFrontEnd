# MindMap Quick Reference

## Common API Operations

### Create a MindMap
```http
POST /api/mindmap
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My MindMap",
  "description": "Optional description"
}
```

### Get Full MindMap (Main Endpoint for Frontend)
```http
GET /api/mindmap/{id}/full
Authorization: Bearer {token}
```

Response includes:
- MindMap details
- All nodes with positions, colors, hideChildren state
- Complete FlashCard info (term, definition, score, learnCount, collection)

### Add Node to MindMap
```http
POST /api/mindmap/{mindMapId}/nodes
Authorization: Bearer {token}
Content-Type: application/json

{
  "flashCardId": 42,
  "parentNodeId": 1,        // null or omit for root node
  "positionX": 500,
  "positionY": 300,
  "color": "#3B82F6",        // optional, defaults to blue
  "hideChildren": false      // optional, defaults to false
}
```

### Update Node Position (Drag & Drop)
```http
PUT /api/mindmap/nodes/{nodeId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "positionX": 650,
  "positionY": 450
}
```

### Change Node Color
```http
PUT /api/mindmap/nodes/{nodeId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "color": "#EF4444"
}
```

### Toggle Hide Children
```http
PUT /api/mindmap/nodes/{nodeId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "hideChildren": true
}
```

### Move Node to Different Parent
```http
PUT /api/mindmap/nodes/{nodeId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "parentNodeId": 3        // or 0 to make it a root node
}
```

### Delete Node
```http
DELETE /api/mindmap/nodes/{nodeId}
Authorization: Bearer {token}
```
Note: Child nodes will become root nodes (not deleted)

### Delete Entire MindMap
```http
DELETE /api/mindmap/{id}
Authorization: Bearer {token}
```
Note: All nodes are deleted automatically (cascade)

## Frontend Implementation Examples

### React Example - Load and Display MindMap

```tsx
import { useEffect, useState } from 'react';

interface Node {
  id: number;
  parentNodeId: number | null;
  positionX: number;
  positionY: number;
  color: string;
  hideChildren: boolean;
  flashCard: {
    id: number;
    term: string;
    definition: string;
    score: number;
    learnCount: number;
  };
}

function MindMapView({ mindMapId, token }: { mindMapId: number; token: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    loadMindMap();
  }, [mindMapId]);

  const loadMindMap = async () => {
    const response = await fetch(`/api/mindmap/${mindMapId}/full`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setNodes(data.nodes);
  };

  const updateNodePosition = async (nodeId: number, x: number, y: number) => {
    await fetch(`/api/mindmap/nodes/${nodeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ positionX: x, positionY: y })
    });
  };

  const toggleHideChildren = async (nodeId: number, currentState: boolean) => {
    await fetch(`/api/mindmap/nodes/${nodeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hideChildren: !currentState })
    });
    loadMindMap(); // Refresh
  };

  return (
    <div className="mindmap-canvas">
      {nodes.map(node => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: node.positionX,
            top: node.positionY,
            backgroundColor: node.color,
          }}
          draggable
          onDragEnd={(e) => updateNodePosition(node.id, e.clientX, e.clientY)}
        >
          <h4>{node.flashCard.term}</h4>
          <p>{node.flashCard.definition}</p>
          <button onClick={() => toggleHideChildren(node.id, node.hideChildren)}>
            {node.hideChildren ? 'Show' : 'Hide'} Children
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Building the Tree Structure

```javascript
function buildTree(nodes) {
  const nodeMap = new Map();
  const roots = [];

  // Create map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Build tree structure
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id);
    if (node.parentNodeId === null) {
      roots.push(currentNode);
    } else {
      const parent = nodeMap.get(node.parentNodeId);
      if (parent) {
        parent.children.push(currentNode);
      }
    }
  });

  return roots;
}
```

### Drawing Connections Between Nodes

```javascript
function drawConnections(nodes, canvas) {
  const ctx = canvas.getContext('2d');
  
  nodes.forEach(node => {
    if (node.parentNodeId) {
      const parent = nodes.find(n => n.id === node.parentNodeId);
      if (parent && !parent.hideChildren) {
        ctx.beginPath();
        ctx.moveTo(parent.positionX, parent.positionY);
        ctx.lineTo(node.positionX, node.positionY);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  });
}
```

## Color Presets

```javascript
const colorPresets = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];
```

## Node States to Track

```typescript
interface NodeState {
  // From API
  id: number;
  positionX: number;
  positionY: number;
  color: string;
  hideChildren: boolean;
  parentNodeId: number | null;
  
  // For UI
  isSelected: boolean;
  isDragging: boolean;
  isExpanded: boolean;
}
```

## Batch Save Pattern

```javascript
// When user clicks "Save All Changes"
async function saveAllChanges(changedNodes, token) {
  const updates = changedNodes.map(node => 
    fetch(`/api/mindmap/nodes/${node.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        positionX: node.positionX,
        positionY: node.positionY,
        color: node.color,
        hideChildren: node.hideChildren
      })
    })
  );
  
  await Promise.all(updates);
}
```

## Error Handling

```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API call failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly message
    showNotification('error', error.message);
    throw error;
  }
}
```

## URL Patterns

```
Base URL: /api/mindmap

MindMaps:
  GET    /api/mindmap                    - List all
  GET    /api/mindmap/{id}               - Get one
  GET    /api/mindmap/{id}/full          - Get full (⭐ main endpoint)
  POST   /api/mindmap                    - Create
  PUT    /api/mindmap/{id}               - Update
  DELETE /api/mindmap/{id}               - Delete

Nodes:
  GET    /api/mindmap/nodes/{nodeId}           - Get one
  POST   /api/mindmap/{mindMapId}/nodes        - Create
  PUT    /api/mindmap/nodes/{nodeId}           - Update
  DELETE /api/mindmap/nodes/{nodeId}           - Delete
```

## Tips

1. **Use the `/full` endpoint** to load all data for display
2. **Update individual nodes** as user makes changes (don't reload entire map)
3. **Batch updates** when user clicks "Save" button
4. **Hide children visually** based on `hideChildren` flag
5. **Validate flashcard selection** on frontend before creating node
6. **Show flashcard details** on node click or hover
7. **Auto-save** node positions on drag end
8. **Tree layout algorithm** should respect saved positions
