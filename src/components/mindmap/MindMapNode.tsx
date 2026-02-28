import { memo, type FC } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface MindMapNodeData {
  label: string;
  color: string;
  hideChildren: boolean;
  nodeId: number | null;     // original DB id (null for brand-new nodes)
  flashCardId: number;
  flashCard: {
    id: number;
    term: string;
    definition: string;
    score: number;
    timesLearned: number;
    flashCardCollectionId: number;
  };
  hasChildren: boolean;
  childrenHidden: boolean;
  onToggleChildren?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
}

type MindMapNodeType = NodeProps & {
  data: MindMapNodeData;
};

const scoreColor = (score: number) => {
  if (score >= 4) return 'text-green-600';
  if (score >= 2) return 'text-blue-600';
  if (score >= 0) return 'text-gray-600';
  if (score >= -2) return 'text-orange-600';
  return 'text-red-600';
};

const MindMapNode: FC<MindMapNodeType> = ({ id, data, selected }) => {
  return (
    <div
      className={`relative min-w-[140px] max-w-[220px] rounded-xl shadow-md border-2 transition-all duration-150
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent'}
      `}
      style={{ backgroundColor: data.color || '#ffffff' }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
      {/* Source handle (top) */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />

      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
      {/* Source handle (left) */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />

      {/* Main content area – click to show details */}
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          data.onNodeClick?.(id);
        }}
      >
        <p className="font-semibold text-sm text-gray-900 text-center leading-tight truncate">
          {data.flashCard.term}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px]">
          <span className={`font-medium ${scoreColor(data.flashCard.score)}`}>
            Score: {data.flashCard.score}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">×{data.flashCard.timesLearned}</span>
        </div>
      </div>

      {/* Toggle children button */}
      {data.hasChildren && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full
            bg-white border border-gray-300 shadow-sm flex items-center justify-center
            text-xs text-gray-500 hover:bg-gray-100 transition"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleChildren?.(id);
          }}
          title={data.childrenHidden ? 'Show children' : 'Hide children'}
        >
          {data.childrenHidden ? '+' : '−'}
        </button>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
      {/* Target handle (bottom) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />

      {/* Source handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
      {/* Target handle (right) */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(MindMapNode);
