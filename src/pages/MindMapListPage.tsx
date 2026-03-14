import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { mindMapService } from '../services/mindMapService';
import { flashCardService } from '../services/flashCardService';
import { aiGenerationService } from '../services/aiGenerationService';
import type { MindMapResponse, FlashCardCollection } from '../types';
import Modal, { ConfirmModal } from '../components/common/Modal';

const AI_PROVIDER_MODELS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  openai: {
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview' },
    ],
  },
};

const ACCEPTED_FILE_TYPES = '.docx,.pptx,.pdf';

type AIGenerateMode = 'from-collection' | 'from-file';

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

  // AI Generate states
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiGenerateMode, setAiGenerateMode] = useState<AIGenerateMode>('from-collection');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerateCollectionId, setAiGenerateCollectionId] = useState<number>(0);
  const [aiGenerateProvider, setAiGenerateProvider] = useState('openai');
  const [aiGenerateModel, setAiGenerateModel] = useState('gpt-4o');
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // "From File" mode states
  const [aiGenerateFile, setAiGenerateFile] = useState<File | null>(null);
  const [aiGenerateParentId, setAiGenerateParentId] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Update model when provider changes
  useEffect(() => {
    const providerConfig = AI_PROVIDER_MODELS[aiGenerateProvider];
    if (providerConfig && providerConfig.models.length > 0) {
      setAiGenerateModel(providerConfig.models[0].value);
    }
  }, [aiGenerateProvider]);

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

  // AI Generate handlers
  const openAIGenerateModal = () => {
    setAiGenerateMode('from-collection');
    setAiGenerateCollectionId(0);
    setAiGenerateProvider('openai');
    setAiGenerateModel('gpt-4o');
    setAiGenerateError(null);
    setAiGenerateFile(null);
    setAiGenerateParentId(0);
    setShowAIGenerateModal(true);
  };

  const closeAIGenerateModal = () => {
    if (aiGenerating) return;
    setShowAIGenerateModal(false);
    setAiGenerateError(null);
    setAiGenerateFile(null);
  };

  const handleFileSelect = (file: File) => {
    const validExtensions = ['.docx', '.pptx', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setAiGenerateError('Invalid file type. Please upload a .docx, .pptx, or .pdf file.');
      return;
    }
    setAiGenerateError(null);
    setAiGenerateFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const switchMode = (mode: AIGenerateMode) => {
    setAiGenerateMode(mode);
    setAiGenerateError(null);
  };

  const canGenerate = aiGenerateMode === 'from-collection'
    ? !!aiGenerateCollectionId
    : !!aiGenerateFile;

  const handleAIGenerate = async () => {
    if (!user?.id) return;

    try {
      setAiGenerating(true);
      setAiGenerateError(null);

      if (aiGenerateMode === 'from-collection') {
        if (!aiGenerateCollectionId) return;

        const result = await aiGenerationService.generateMindMap({
          collectionId: aiGenerateCollectionId,
          userId: user.id,
          provider: aiGenerateProvider,
          model: aiGenerateModel,
        });

        setShowAIGenerateModal(false);
        setSuccessMessage(
          `✅ Mind map "${result.mindMap.title}" with ${result.mindMap.nodes.length} node${result.mindMap.nodes.length !== 1 ? 's' : ''} has been created!`
        );
      } else {
        if (!aiGenerateFile) return;

        const result = await aiGenerationService.generateAll({
          file: aiGenerateFile,
          parentCollectionId: aiGenerateParentId,
          userId: user.id,
          provider: aiGenerateProvider,
          model: aiGenerateModel,
        });

        setShowAIGenerateModal(false);
        setAiGenerateFile(null);
        setSuccessMessage(
          `✅ Collection "${result.collection.title}" with ${result.flashCards.length} flashcard${result.flashCards.length !== 1 ? 's' : ''} and a mind map with ${result.mindMap.nodes.length} node${result.mindMap.nodes.length !== 1 ? 's' : ''} have been created!`
        );
      }

      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setAiGenerateError(
        error.response?.data?.message || 'Failed to generate. Please try again.'
      );
    } finally {
      setAiGenerating(false);
    }
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
        <div className="flex items-center gap-3">
          <button
            onClick={openAIGenerateModal}
            className="px-5 py-2.5 text-white rounded-lg transition-all hover:shadow-lg font-medium shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            title="Generate a mind map using AI"
          >
            ✨ AI Generate
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            + New Mind Map
          </button>
        </div>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700 ml-4 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

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
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={openAIGenerateModal}
              className="px-5 py-2 text-white rounded-lg transition-all hover:shadow-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            >
              ✨ AI Generate
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              + New Mind Map
            </button>
          </div>
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

      {/* ── AI Generate Modal ── */}
      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            {/* Loading Overlay */}
            {aiGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-gray-700">
                  {aiGenerateMode === 'from-file' ? 'Generating flashcards & mind map...' : 'Generating mind map...'}
                </p>
                <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-1">✨ AI Generate Mind Map</h2>
            <p className="text-sm text-gray-500 mb-4">Choose how to generate your mind map</p>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
              <button
                onClick={() => switchMode('from-collection')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  aiGenerateMode === 'from-collection'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📂 From Collection
              </button>
              <button
                onClick={() => switchMode('from-file')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  aiGenerateMode === 'from-file'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📄 From File
              </button>
            </div>

            <div className="space-y-4">
              {/* ── From Collection tab ── */}
              {aiGenerateMode === 'from-collection' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flashcard Collection <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiGenerateCollectionId}
                    onChange={(e) => setAiGenerateCollectionId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value={0}>Select a collection…</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title} ({col.flashCardCount} cards)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">AI will generate a mind map from the flashcards in this collection</p>
                </div>
              )}

              {/* ── From File tab ── */}
              {aiGenerateMode === 'from-file' && (
                <>
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document <span className="text-red-500">*</span>
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-50'
                          : aiGenerateFile
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                      {aiGenerateFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{aiGenerateFile.name}</p>
                            <p className="text-xs text-gray-500">{(aiGenerateFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiGenerateFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-emerald-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Supported: .docx, .pptx, .pdf</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Parent Collection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Collection
                    </label>
                    <select
                      value={aiGenerateParentId}
                      onChange={(e) => setAiGenerateParentId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value={0}>None (Root level)</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">AI will create flashcards and a mind map from your document</p>
                  </div>
                </>
              )}

              {/* Provider & Model (shared by both tabs) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiGenerateProvider}
                    onChange={(e) => setAiGenerateProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {Object.entries(AI_PROVIDER_MODELS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aiGenerateModel}
                    onChange={(e) => setAiGenerateModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {AI_PROVIDER_MODELS[aiGenerateProvider]?.models.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {aiGenerateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {aiGenerateError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAIGenerate}
                disabled={!canGenerate || aiGenerating}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
              >
                {aiGenerating ? 'Generating...' : '✨ Generate'}
              </button>
              <button
                onClick={closeAIGenerateModal}
                disabled={aiGenerating}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
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
