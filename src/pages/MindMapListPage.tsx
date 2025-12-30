import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mindMapService } from '../services/mindMapService';
import type { MindMap } from '../types';
import { useAuthStore } from '../store/authStore';

const MindMapListPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMindMap, setNewMindMap] = useState({ name: '', description: '' });
  const [editingMindMap, setEditingMindMap] = useState<MindMap | null>(null);

  useEffect(() => {
    loadMindMaps();
  }, []);

  const loadMindMaps = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const data = await mindMapService.getAllMindMaps(user.id);
      setMindMaps(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load mindmaps';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMindMap = async () => {
    if (!newMindMap.name.trim()) {
      setError('MindMap name is required');
      return;
    }

    try {
      const created = await mindMapService.createMindMap({
        name: newMindMap.name,
        description: newMindMap.description,
      });
      setShowCreateModal(false);
      setNewMindMap({ name: '', description: '' });
      await loadMindMaps();
      navigate(`/mindmap/${created.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mindmap';
      setError(errorMessage);
    }
  };

  const handleUpdateMindMap = async () => {
    if (!editingMindMap) return;

    try {
      await mindMapService.updateMindMap(editingMindMap.id, {
        name: editingMindMap.name,
        description: editingMindMap.description,
      });
      setEditingMindMap(null);
      await loadMindMaps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mindmap';
      setError(errorMessage);
    }
  };

  const handleDeleteMindMap = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this mindmap? This action cannot be undone.')) {
      return;
    }

    try {
      await mindMapService.deleteMindMap(id);
      await loadMindMaps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mindmap';
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading mindmaps...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My MindMaps</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          + Create New MindMap
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {mindMaps.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">No mindmaps yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Your First MindMap
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindMaps.map((mindMap) => (
            <div
              key={mindMap.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
            >
              <h3 className="text-xl font-semibold mb-2">{mindMap.name}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {mindMap.description || 'No description'}
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Created: {formatDate(mindMap.createdAt)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/mindmap/${mindMap.id}`)}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Open
                </button>
                <button
                  onClick={() => setEditingMindMap(mindMap)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMindMap(mindMap.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New MindMap</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={newMindMap.name}
                  onChange={(e) => setNewMindMap({ ...newMindMap, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter mindmap name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newMindMap.description}
                  onChange={(e) => setNewMindMap({ ...newMindMap, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateMindMap}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewMindMap({ name: '', description: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMindMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit MindMap</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={editingMindMap.name}
                  onChange={(e) =>
                    setEditingMindMap({ ...editingMindMap, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingMindMap.description}
                  onChange={(e) =>
                    setEditingMindMap({ ...editingMindMap, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateMindMap}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingMindMap(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapListPage;
