import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { mindMapService } from '../services/mindMapService';
import { flashCardService } from '../services/flashCardService';
import type { MindMapResponse, FlashCardCollection } from '../types';
import Modal, { ConfirmModal } from '../components/common/Modal';

const MindMapListPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [mindMaps, setMindMaps] = useState<MindMapResponse[]>([]);
  const [collections, setCollections] = useState<FlashCardCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', flashCardCollectionId: 0 });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMap, setEditingMap] = useState<MindMapResponse | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  // Delete confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMap, setDeletingMap] = useState<MindMapResponse | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const [maps, cols] = await Promise.all([
        mindMapService.getMindMapsByUser(user.id),
        flashCardService.getCollectionsByUserId(user.id),
      ]);
      setMindMaps(maps);
      setCollections(cols);
    } catch {
      setError('Failed to load mind maps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.id || !createForm.title.trim() || !createForm.flashCardCollectionId) return;
    try {
      await mindMapService.createMindMap({
        title: createForm.title,
        description: createForm.description,
        userId: user.id,
        flashCardCollectionId: createForm.flashCardCollectionId,
      });
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', flashCardCollectionId: 0 });
      await loadData();
    } catch {
      setError('Failed to create mind map');
    }
  };

  const handleEdit = async () => {
    if (!editingMap || !editForm.title.trim()) return;
    try {
      await mindMapService.updateMindMap(editingMap.id, {
        title: editForm.title,
        description: editForm.description,
      });
      setShowEditModal(false);
      setEditingMap(null);
      await loadData();
    } catch {
      setError('Failed to update mind map');
    }
  };

  const handleDelete = async () => {
    if (!deletingMap) return;
    try {
      await mindMapService.deleteMindMap(deletingMap.id);
      setShowDeleteModal(false);
      setDeletingMap(null);
      await loadData();
    } catch {
      setError('Failed to delete mind map');
    }
  };

  const openEdit = (map: MindMapResponse) => {
    setEditingMap(map);
    setEditForm({ title: map.title, description: map.description || '' });
    setShowEditModal(true);
  };

  const openDelete = (map: MindMapResponse) => {
    setDeletingMap(map);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧠 Mind Maps</h1>
          <p className="text-gray-500 mt-1">Visualise your flash cards as mind maps</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
        >
          + New Mind Map
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Mind Map Grid */}
      {mindMaps.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-5xl mb-4">🧠</p>
          <p className="text-gray-500 text-lg">No mind maps yet</p>
          <p className="text-gray-400 text-sm mt-1">Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mindMaps.map((map) => (
            <div
              key={map.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card header – clickable to open editor */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => navigate(`/mindmap/${map.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-900 truncate">{map.title}</h3>
                {map.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{map.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>📂 {map.collectionTitle}</span>
                  <span>🔗 {map.nodeCount} nodes</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Updated {new Date(map.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Card actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => navigate(`/mindmap/${map.id}`)}
                  className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                >
                  Open
                </button>
                <button
                  onClick={() => openEdit(map)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDelete(map)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Mind Map"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!createForm.title.trim() || !createForm.flashCardCollectionId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="My Mind Map"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection *</label>
            <select
              value={createForm.flashCardCollectionId}
              onChange={(e) =>
                setCreateForm({ ...createForm, flashCardCollectionId: Number(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={0}>Select a collection…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Mind Map"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={!editForm.title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Mind Map"
        message={`Are you sure you want to delete "${deletingMap?.title}"? This will remove the mind map and all its nodes permanently.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default MindMapListPage;
