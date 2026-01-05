import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mindMapService } from '../services/mindMapService';
import { flashCardService } from '../services/flashCardService';
import { useAuthStore } from '../store/authStore';
import { ConfirmModal, AlertModal } from '../components/common/Modal';
import type { FullMindMapResponse, MindMapNodeWithFlashCard, FlashCard, FlashCardCollection } from '../types';

interface Position {
  x: number;
  y: number;
}

interface DragState {
  nodeId: number | null;
  offsetX: number;
  offsetY: number;
}

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const MindMapCanvasPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [mindMap, setMindMap] = useState<FullMindMapResponse | null>(null);
  const [nodes, setNodes] = useState<MindMapNodeWithFlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNodeWithFlashCard | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  // Flashcard selector state
  const [showFlashCardSelector, setShowFlashCardSelector] = useState(false);
  const [collections, setCollections] = useState<FlashCardCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [parentNodeForNew, setParentNodeForNew] = useState<number | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: MindMapNodeWithFlashCard } | null>(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [nodeForAddChild, setNodeForAddChild] = useState<MindMapNodeWithFlashCard | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const init = async () => {
      await loadMindMap();
      await loadCollections();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMindMap = async () => {
    try {
      setLoading(true);
      const data = await mindMapService.getFullMindMap(Number(id));
      setMindMap(data);
      setNodes(data.nodes);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load mindmap';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    if (!user?.id) return;
    try {
      const data = await flashCardService.getCollectionsByUserId(user.id);
      console.log('Loaded collections:', data);
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const loadFlashCards = async (collectionId: number) => {
    try {
      const data = await flashCardService.getFlashCardsByCollection(collectionId, 1, 100);
      setFlashCards(data.flashCards);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    }
  };

  const handleAddNode = async (flashCardId: number) => {
    if (!id) return;

    const newPosition = {
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
    };

    try {
      await mindMapService.createNode(Number(id), {
        flashCardId,
        parentNodeId: parentNodeForNew,
        positionX: newPosition.x,
        positionY: newPosition.y,
        color: COLOR_PRESETS[0],
      });
      await loadMindMap();
      setShowFlashCardSelector(false);
      setParentNodeForNew(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add node';
      setError(errorMessage);
    }
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: MindMapNodeWithFlashCard) => {
    if (isPanning) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - (node.positionX * zoom + panOffset.x + rect.left);
    const offsetY = e.clientY - (node.positionY * zoom + panOffset.y + rect.top);

    setDragState({ nodeId: node.id, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragState) {
      const newX = (e.clientX - rect.left - panOffset.x - dragState.offsetX) / zoom;
      const newY = (e.clientY - rect.top - panOffset.y - dragState.offsetY) / zoom;

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, positionX: newX, positionY: newY }
            : node
        )
      );
      setHasChanges(true);
    } else if (isPanning) {
      setPanOffset({
        x: panOffset.x + (e.clientX - panStart.x),
        y: panOffset.y + (e.clientY - panStart.y),
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setIsPanning(false);
  };

  const handleCanvasPanStart = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.3));

  const handleToggleHideChildren = async (node: MindMapNodeWithFlashCard) => {
    try {
      await mindMapService.updateNode(node.id, {
        hideChildren: !node.hideChildren,
      });
      await loadMindMap();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle children';
      setError(errorMessage);
    }
  };

  const handleChangeColor = async (node: MindMapNodeWithFlashCard, color: string) => {
    try {
      await mindMapService.updateNode(node.id, { color });
      setNodes((prevNodes) =>
        prevNodes.map((n) => (n.id === node.id ? { ...n, color } : n))
      );
      setHasChanges(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change color';
      setError(errorMessage);
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Node',
      message: 'Delete this node? Child nodes will become root nodes.',
      onConfirm: async () => {
        try {
          await mindMapService.deleteNode(nodeId);
          await loadMindMap();
          setSelectedNode(null);
          setContextMenu(null);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete node';
          setError(errorMessage);
        }
      },
    });
  };

  const handleRightClick = (e: React.MouseEvent, node: MindMapNodeWithFlashCard) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleAddChildFromCanvas = async (childNodeId: number) => {
    if (!nodeForAddChild) return;

    try {
      await mindMapService.updateNode(childNodeId, {
        parentNodeId: nodeForAddChild.id,
      });
      await loadMindMap();
      setShowNodeSelector(false);
      setNodeForAddChild(null);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Child node added successfully!',
        type: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add child node';
      setError(errorMessage);
    }
  };

  const getAvailableNodesForChild = () => {
    if (!nodeForAddChild) return [];
    
    // Get all descendant IDs to prevent circular dependencies
    const getDescendants = (nodeId: number): Set<number> => {
      const descendants = new Set<number>();
      const addDescendants = (id: number) => {
        nodes.forEach((node) => {
          if (node.parentNodeId === id) {
            descendants.add(node.id);
            addDescendants(node.id);
          }
        });
      };
      addDescendants(nodeId);
      return descendants;
    };

    const descendants = getDescendants(nodeForAddChild.id);
    
    // Filter out the node itself, its descendants, and nodes that already have this as parent
    return nodes.filter(
      (node) => 
        node.id !== nodeForAddChild.id && 
        !descendants.has(node.id) &&
        node.parentNodeId !== nodeForAddChild.id
    );
  };

  const handleSaveChanges = async () => {
    try {
      const updates = nodes.map((node) => ({
        nodeId: node.id,
        data: {
          positionX: node.positionX,
          positionY: node.positionY,
        },
      }));
      await mindMapService.batchUpdateNodes(updates);
      setHasChanges(false);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Changes saved successfully!',
        type: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
    }
  };

  const getVisibleNodes = () => {
    const hiddenNodeIds = new Set<number>();
    
    const markHidden = (parentId: number) => {
      nodes.forEach((node) => {
        if (node.parentNodeId === parentId) {
          hiddenNodeIds.add(node.id);
          markHidden(node.id);
        }
      });
    };

    nodes.forEach((node) => {
      if (node.hideChildren) {
        markHidden(node.id);
      }
    });

    return nodes.filter((node) => !hiddenNodeIds.has(node.id));
  };

  const renderConnections = () => {
    const visibleNodes = getVisibleNodes();
    return (
      <>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
          </marker>
        </defs>
        {visibleNodes.map((node) => {
          if (!node.parentNodeId) return null;
          const parent = nodes.find((n) => n.id === node.parentNodeId);
          if (!parent || parent.hideChildren) return null;

          // Calculate direction for arrow placement
          const dx = node.positionX - parent.positionX;
          const dy = node.positionY - parent.positionY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;
          
          // Shorten line to account for node size (approximate 75px from each end)
          const offset = 1;
          const startX = parent.positionX + unitX * offset;
          const startY = parent.positionY + unitY * offset;
          const endX = node.positionX - unitX * offset;
          const endY = node.positionY - unitY * offset;

          return (
            <line
              key={`line-${node.id}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={node.color}
              strokeWidth={2 / zoom}
              opacity={0.6}
              markerEnd="url(#arrowhead)"
              style={{ color: node.color }}
            />
          );
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading mindmap...</div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">MindMap not found</div>
      </div>
    );
  }

  const visibleNodes = getVisibleNodes();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/mindmap')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{mindMap.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setParentNodeForNew(null);
              setShowFlashCardSelector(true);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            + Add Node
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            🔍−
          </button>
          <button
            onClick={handleZoomIn}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            🔍+
          </button>
          {hasChanges && (
            <button
              onClick={handleSaveChanges}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 animate-pulse"
            >
              💾 Save Changes
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-6 mt-4 rounded">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 bg-gray-100 relative overflow-hidden cursor-move"
        onMouseDown={handleCanvasPanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setContextMenu(null)}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {renderConnections()}
        </svg>

        {visibleNodes.map((node) => (
          <div
            key={node.id}
            className="absolute cursor-move"
            style={{
              left: node.positionX * zoom + panOffset.x,
              top: node.positionY * zoom + panOffset.y,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              backgroundColor: node.color,
              minWidth: 150,
            }}
            onMouseDown={(e) => handleNodeDragStart(e, node)}
            onContextMenu={(e) => handleRightClick(e, node)}
          >
            <div
              onClick={() => setSelectedNode(node)}
              className="p-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition"
            >
              <div className="font-semibold text-white">{node.flashCard.term}</div>
              <div className="text-xs text-white mt-1 opacity-90">
                Score: {node.flashCard.score} | Learned: {node.flashCard.learnCount}
              </div>
              {nodes.some((n) => n.parentNodeId === node.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleHideChildren(node);
                  }}
                  className="mt-2 text-xs bg-white bg-opacity-20 text-white px-2 py-1 rounded hover:bg-opacity-30"
                >
                  {node.hideChildren ? '👁️ Show' : '🙈 Hide'} Children
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto z-50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Node Details</h2>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedNode.flashCard.term}</h3>
              <p className="text-gray-700 mt-2">{selectedNode.flashCard.definition}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm space-y-1">
                <div>Score: {selectedNode.flashCard.score}</div>
                <div>Times Learned: {selectedNode.flashCard.learnCount}</div>
                <div>Collection: {selectedNode.flashCard.collectionName}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Node Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChangeColor(selectedNode, color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      selectedNode.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setNodeForAddChild(selectedNode);
                  setShowNodeSelector(true);
                }}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Child Node
              </button>
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FlashCard Selector Modal */}
      {showFlashCardSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Select FlashCard</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Collection</label>
              <select
                value={selectedCollection || ''}
                onChange={(e) => {
                  const collId = Number(e.target.value);
                  setSelectedCollection(collId);
                  loadFlashCards(collId);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select a collection</option>
                {collections.map((coll) => (
                  <option key={coll.id} value={coll.id}>
                    {coll.title} ({coll.flashCardCount} cards)
                  </option>
                ))}
              </select>
            </div>

            {flashCards.length > 0 && (
              <div className="space-y-2 mb-4">
                {flashCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleAddNode(card.id)}
                    className="border border-gray-300 rounded p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-semibold">{card.term}</div>
                    <div className="text-sm text-gray-600">{card.definition}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Score: {card.score}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowFlashCardSelector(false);
                setParentNodeForNew(null);
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border border-gray-200 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setNodeForAddChild(contextMenu.node);
              setShowNodeSelector(true);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Child Node</span>
          </button>
          <button
            onClick={() => {
              handleDeleteNode(contextMenu.node.id);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 transition-colors flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Delete Node</span>
          </button>
        </div>
      )}

      {/* Node Selector Modal for Adding Child */}
      {showNodeSelector && nodeForAddChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Select Node to Add as Child</h2>
            <p className="text-gray-600 mb-4">
              Select a node from the canvas to add as a child of <strong>{nodeForAddChild.flashCard.term}</strong>
            </p>

            {getAvailableNodesForChild().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available nodes to add as children.
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {getAvailableNodesForChild().map((node) => (
                  <div
                    key={node.id}
                    onClick={() => handleAddChildFromCanvas(node.id)}
                    className="border-2 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ borderColor: node.color }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: node.color }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{node.flashCard.term}</div>
                        <div className="text-sm text-gray-600">{node.flashCard.definition}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {node.flashCard.score} | Collection: {node.flashCard.collectionName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowNodeSelector(false);
                setNodeForAddChild(null);
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default MindMapCanvasPage;
