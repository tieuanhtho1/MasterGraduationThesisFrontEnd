import type { FC } from 'react';
import type { MindMapNodeData } from './MindMapNode';

interface NodeDetailPanelProps {
  nodeData: MindMapNodeData;
  rfNodeId: string;
  onClose: () => void;
  onChangeColor: (color: string) => void;
}

const PRESET_COLORS = [
  '#ffffff', '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9',
  '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB',
  '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3',
  '#FFE0B2', '#FFCCBC', '#D7CCC8', '#CFD8DC',
];

const scoreLabel = (score: number) => {
  if (score >= 4) return { text: 'Mastered', cls: 'bg-green-100 text-green-700' };
  if (score >= 2) return { text: 'Good', cls: 'bg-blue-100 text-blue-700' };
  if (score >= 0) return { text: 'Learning', cls: 'bg-gray-100 text-gray-700' };
  if (score >= -2) return { text: 'Needs work', cls: 'bg-orange-100 text-orange-700' };
  return { text: 'Struggling', cls: 'bg-red-100 text-red-700' };
};

const NodeDetailPanel: FC<NodeDetailPanelProps> = ({
  nodeData,
  onClose,
  onChangeColor,
}) => {
  const { flashCard, color } = nodeData;
  const sl = scoreLabel(flashCard.score);

  return (
    <div className="absolute top-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">Node Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Flash card info */}
        <div>
          <p className="text-lg font-bold text-gray-900">{flashCard.term}</p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{flashCard.definition}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${sl.cls}`}>
            {sl.text}
          </span>
          <span className="text-xs text-gray-500">
            Score: {flashCard.score} · Learned: {flashCard.timesLearned}×
          </span>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Node Color</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChangeColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c ? 'border-indigo-500 scale-110' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default NodeDetailPanel;
