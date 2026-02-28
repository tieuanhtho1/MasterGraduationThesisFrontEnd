import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { mindMapService } from '../services/mindMapService';
import type { MindMapDetailResponse, MindMapNodeResponse, MindMapEdgeResponse, FlashCard } from '../types';
import MindMapCustomNode, { type MindMapNodeData } from '../components/mindmap/MindMapNode';
import NodeDetailPanel from '../components/mindmap/NodeDetailPanel';
import FlashCardPicker from '../components/mindmap/FlashCardPicker';


/* ─── helpers ──────────────────────────────────────────── */

/** Build a RF node from an API node response */
const toRFNode = (
  n: MindMapNodeResponse,
  childrenIds: Set<number>,
  hiddenNodeIds: Set<number>,
): Node => ({
  id: String(n.id),
  type: 'mindMapNode',
  position: { x: n.positionX, y: n.positionY },
  hidden: hiddenNodeIds.has(n.id),
  data: {
    label: n.flashCard.term,
    color: n.color || '#ffffff',
    hideChildren: n.hideChildren,
    nodeId: n.id,
    flashCardId: n.flashCardId,
    flashCard: n.flashCard,
    hasChildren: childrenIds.has(n.id),
    childrenHidden: n.hideChildren,
  } satisfies MindMapNodeData,
});

/** Build React Flow edges from API edge responses */
const buildEdges = (edges: MindMapEdgeResponse[]): Edge[] =>
  edges.map((e) => ({
    id: `e${e.id ?? `${e.sourceNodeId}-${e.targetNodeId}-${e.sourceHandle}-${e.targetHandle}`}`,
    source: String(e.sourceNodeId),
    target: String(e.targetNodeId),
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    data: { apiEdgeId: e.id }, // keep reference to API edge id
  }));

/** Compute all node ids whose ancestor has hideChildren=true (using edges for parent→child) */
const computeHiddenIds = (
  apiNodes: MindMapNodeResponse[],
  apiEdges: MindMapEdgeResponse[],
): Set<number> => {
  const hidden = new Set<number>();
  // Build a map: sourceNodeId → [targetNodeIds] (parent → children via edges)
  const childrenByParent = new Map<number, number[]>();
  for (const e of apiEdges) {
    const arr = childrenByParent.get(e.sourceNodeId) || [];
    arr.push(e.targetNodeId);
    childrenByParent.set(e.sourceNodeId, arr);
  }
  const traverse = (parentId: number) => {
    const children = childrenByParent.get(parentId) || [];
    for (const childId of children) {
      if (!hidden.has(childId)) {
        hidden.add(childId);
        traverse(childId);
      }
    }
  };
  for (const n of apiNodes) {
    if (n.hideChildren) traverse(n.id);
  }
  return hidden;
};

/** Compute set of node ids that have at least one child (are a source in any edge) */
const computeChildrenIds = (apiEdges: MindMapEdgeResponse[]): Set<number> => {
  const ids = new Set<number>();
  for (const e of apiEdges) {
    ids.add(e.sourceNodeId);
  }
  return ids;
};

/* ─── Component ──────────────────────────────────────── */

const nodeTypes = { mindMapNode: MindMapCustomNode };

const MindMapEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mindMapId = Number(id);

  // Core data
  const [mindMap, setMindMap] = useState<MindMapDetailResponse | null>(null);
  const [apiNodes, setApiNodes] = useState<MindMapNodeResponse[]>([]);
  const [apiEdges, setApiEdges] = useState<MindMapEdgeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showFlashCardPicker, setShowFlashCardPicker] = useState(false);
  const [addChildForNodeId, setAddChildForNodeId] = useState<string | null>(null); // when adding child to specific node


  // Remember collection for adding flash cards
  const defaultCollectionId = mindMap?.flashCardCollectionId;

  // Temp counter for new node ids (negative so they don't clash with DB ids)
  const tempIdRef = useRef(-1);

  /* ─── Rebuild React Flow from API nodes + edges ────── */
  const rebuildFlow = useCallback((nodes: MindMapNodeResponse[], edges: MindMapEdgeResponse[]) => {
    const hiddenIds = computeHiddenIds(nodes, edges);
    const childrenIds = computeChildrenIds(edges);
    const rfN = nodes.map((n) => toRFNode(n, childrenIds, hiddenIds));
    const rfE = buildEdges(edges);
    setRfNodes(rfN);
    setRfEdges(rfE);
  }, [setRfNodes, setRfEdges]);

  /* ─── Load mind map ─────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mindMapService.getMindMapDetail(mindMapId);
        setMindMap(data);
        setApiNodes(data.nodes);
        setApiEdges(data.edges ?? []);
        rebuildFlow(data.nodes, data.edges ?? []);
      } catch {
        setError('Failed to load mind map');
      } finally {
        setLoading(false);
      }
    };
    if (mindMapId) load();
  }, [mindMapId, rebuildFlow]);

  /* ─── Keep node data callbacks fresh ───────────────── */
  useEffect(() => {
    setRfNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onNodeClick: handleNodeClick,
          onToggleChildren: handleToggleChildren,
        },
      })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiNodes]); // re-wire after any structural change — handleNodeClick/handleToggleChildren declared below

  /* ─── Handlers ─────────────────────────────────────── */

  const handleNodeClick = useCallback((rfId: string) => {
    setSelectedNodeId(rfId);
  }, []);

  const handleToggleChildren = useCallback(
    (rfId: string) => {
      setApiNodes((prev) => {
        const updated = prev.map((n) =>
          String(n.id) === rfId ? { ...n, hideChildren: !n.hideChildren } : n,
        );
        // Rebuild visibility using current apiEdges
        const hiddenIds = computeHiddenIds(updated, apiEdges);

        setRfNodes((rfN) =>
          rfN.map((rn) => {
            const apiNode = updated.find((a) => String(a.id) === rn.id);
            if (!apiNode) return rn;
            return {
              ...rn,
              hidden: hiddenIds.has(apiNode.id),
              data: {
                ...rn.data,
                hideChildren: apiNode.hideChildren,
                childrenHidden: apiNode.hideChildren,
                onNodeClick: handleNodeClick,
                onToggleChildren: handleToggleChildren,
              },
            };
          }),
        );

        // Also hide/show edges
        setRfEdges((rfE) =>
          rfE.map((e) => ({
            ...e,
            hidden: hiddenIds.has(Number(e.target)),
          })),
        );

        setDirty(true);
        return updated;
      });
    },
    [setRfNodes, setRfEdges, handleNodeClick, apiEdges],
  );

  /** When user drags nodes, keep our apiNodes in sync */
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Check for position changes
      const posChanges = changes.filter(
        (c) => c.type === 'position' && 'position' in c && c.position,
      );
      if (posChanges.length > 0) {
        setDirty(true);
      }
    },
    [onNodesChange],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      // Use a unique edge ID so reverse-direction edges (A→B vs B→A) are not deduplicated
      const tempEdgeId = tempIdRef.current--;
      const edgeId = `e${tempEdgeId}`;

      setRfEdges((eds) => [
        ...eds,
        {
          id: edgeId,
          source: conn.source,
          target: conn.target,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          data: { apiEdgeId: tempEdgeId },
        },
      ]);

      // Add to apiEdges with handle info
      const newApiEdge: MindMapEdgeResponse = {
        id: tempEdgeId,
        sourceNodeId: Number(conn.source),
        targetNodeId: Number(conn.target),
        sourceHandle: conn.sourceHandle || 'bottom',
        targetHandle: conn.targetHandle || 'top',
        mindMapId,
      };
      setApiEdges((prev) => [...prev, newApiEdge]);
      setDirty(true);
    },
    [setRfEdges, mindMapId],
  );

  /** Handle edge changes (including deletions) from React Flow */
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      // Check for edge removals and sync to apiEdges
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length > 0) {
        const removedRfIds = new Set(removals.map((c) => c.id));

        // Get the current rfEdges to find the source/target info before they're removed
        setApiEdges((prevApiEdges) => {
          // Match by RF edge id pattern: e{apiEdgeId} or e{sourceNodeId}-{targetNodeId}-{sourceHandle}-{targetHandle}
          return prevApiEdges.filter((apiEdge) => {
            const rfId = `e${apiEdge.id ?? `${apiEdge.sourceNodeId}-${apiEdge.targetNodeId}-${apiEdge.sourceHandle}-${apiEdge.targetHandle}`}`;
            return !removedRfIds.has(rfId);
          });
        });
        setDirty(true);
      }
    },
    [onEdgesChange],
  );

  /* ─── Add node ─────────────────────────────────────── */
  const handleAddNode = useCallback(
    (parentRfId: string | null) => {
      setAddChildForNodeId(parentRfId);
      setShowFlashCardPicker(true);
    },
    [],
  );

  const handleFlashCardSelected = useCallback(
    (flashCard: FlashCard) => {
      const parentRfId = addChildForNodeId;
      const parentNode = parentRfId ? rfNodes.find((n) => n.id === parentRfId) : null;

      // Position near parent or center
      const x = parentNode ? parentNode.position.x + 50 : 300;
      const y = parentNode ? parentNode.position.y + 150 : 200;

      const tempId = tempIdRef.current--;
      const newApiNode: MindMapNodeResponse = {
        id: tempId,
        positionX: x,
        positionY: y,
        color: '#ffffff',
        hideChildren: false,
        mindMapId,
        flashCardId: flashCard.id,
        flashCard: {
          id: flashCard.id,
          term: flashCard.term,
          definition: flashCard.definition,
          score: flashCard.score,
          timesLearned: 0,
          flashCardCollectionId: flashCard.flashCardCollectionId,
        },
      };

      // If adding as a child, create an edge from parent to new node
      let newEdge: MindMapEdgeResponse | null = null;
      if (parentRfId) {
        const edgeTempId = tempIdRef.current--;
        newEdge = {
          id: edgeTempId,
          sourceNodeId: Number(parentRfId),
          targetNodeId: tempId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          mindMapId,
        };
      }

      setApiNodes((prev) => {
        const updatedNodes = [...prev, newApiNode];
        setApiEdges((prevEdges) => {
          const updatedEdges = newEdge ? [...prevEdges, newEdge] : prevEdges;
          rebuildFlow(updatedNodes, updatedEdges);
          return updatedEdges;
        });
        return updatedNodes;
      });

      setShowFlashCardPicker(false);
      setAddChildForNodeId(null);
      setDirty(true);
    },
    [addChildForNodeId, rfNodes, mindMapId, rebuildFlow],
  );

  /* ─── Change color ─────────────────────────────────── */
  const handleChangeColor = useCallback(
    (color: string) => {
      if (!selectedNodeId) return;
      setApiNodes((prev) =>
        prev.map((n) => (String(n.id) === selectedNodeId ? { ...n, color } : n)),
      );
      setRfNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                data: { ...n.data, color },
              }
            : n,
        ),
      );
      setDirty(true);
    },
    [selectedNodeId, setRfNodes],
  );



  /* ─── Save ─────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      // Get latest positions from rfNodes
      const currentRfNodes = rfNodes;

      const nodesToSave = apiNodes.map((apiNode) => {
        const rfNode = currentRfNodes.find((rn) => rn.id === String(apiNode.id));
        return {
          id: apiNode.id > 0 ? apiNode.id : null, // negative = new
          positionX: rfNode?.position.x ?? apiNode.positionX,
          positionY: rfNode?.position.y ?? apiNode.positionY,
          color: apiNode.color,
          hideChildren: apiNode.hideChildren,
          flashCardId: apiNode.flashCardId,
        };
      });

      const edgesToSave = apiEdges.map((apiEdge) => ({
        id: apiEdge.id > 0 ? apiEdge.id : null, // negative = new
        sourceNodeId: apiEdge.sourceNodeId,
        targetNodeId: apiEdge.targetNodeId,
        sourceHandle: apiEdge.sourceHandle,
        targetHandle: apiEdge.targetHandle,
      }));

      const result = await mindMapService.saveAllNodes(mindMapId, {
        nodes: nodesToSave,
        edges: edgesToSave,
      });
      // Refresh with returned data (new IDs from server)
      setApiNodes(result.nodes);
      setApiEdges(result.edges ?? []);
      rebuildFlow(result.nodes, result.edges ?? []);
      setDirty(false);
    } catch {
      setError('Failed to save mind map');
    } finally {
      setSaving(false);
    }
  }, [apiNodes, apiEdges, rfNodes, mindMapId, rebuildFlow]);

  /* ─── Derived data ─────────────────────────────────── */
  const selectedNode = useMemo(
    () => (selectedNodeId ? rfNodes.find((n) => n.id === selectedNodeId) : null),
    [selectedNodeId, rfNodes],
  );

  const usedFlashCardIds = useMemo(
    () => new Set(apiNodes.map((n) => n.flashCardId)),
    [apiNodes],
  );

  /* ─── Render ───────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error && !mindMap) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate('/mindmap')} className="text-indigo-600 hover:underline">
          ← Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mindmap')}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ← Back
          </button>
          <h2 className="font-semibold text-gray-900">{mindMap?.title}</h2>
          {mindMap?.collectionTitle && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              📂 {mindMap.collectionTitle}
            </span>
          )}
          {dirty && <span className="text-xs text-amber-600 font-medium">● Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddNode(null)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            + Add Root Node
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={3}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap
            nodeColor={(n) => (n.data as unknown as MindMapNodeData)?.color || '#e2e8f0'}
            maskColor="rgba(0,0,0,0.08)"
            className="!bg-white !border !border-gray-200 !rounded-lg !shadow"
          />

          {/* Empty state hint */}
          {rfNodes.length === 0 && (
            <Panel position="top-center">
              <div className="mt-20 bg-white border border-gray-200 rounded-xl px-8 py-6 shadow-lg text-center">
                <p className="text-4xl mb-3">🧠</p>
                <p className="text-gray-700 font-medium">This mind map is empty</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click "+ Add Root Node" to add your first flash card
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* Node detail panel */}
        {selectedNode && (
          <NodeDetailPanel
            nodeData={selectedNode.data as unknown as MindMapNodeData}
            rfNodeId={selectedNode.id}
            onClose={() => setSelectedNodeId(null)}
            onChangeColor={handleChangeColor}
          />
        )}
      </div>

      {/* Flash card picker */}
      <FlashCardPicker
        isOpen={showFlashCardPicker}
        onClose={() => {
          setShowFlashCardPicker(false);
          setAddChildForNodeId(null);
        }}
        onSelect={handleFlashCardSelected}
        defaultCollectionId={defaultCollectionId}
        defaultCollectionTitle={mindMap?.collectionTitle}
        usedFlashCardIds={usedFlashCardIds}
      />

    </div>
  );
};

export default MindMapEditorPage;
