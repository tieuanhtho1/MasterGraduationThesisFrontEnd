import { useAuthStore } from '../store/authStore';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashCardService } from '../services/flashCardService';
import { aiGenerationService } from '../services/aiGenerationService';
import type { FlashCardCollection, CreateFlashCardCollectionDto } from '../types';
import { ANIMATION_DURATION } from '../constants/animations';

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

const CollectionPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [collections, setCollections] = useState<FlashCardCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<FlashCardCollection | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // AI Generate states
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerateFile, setAiGenerateFile] = useState<File | null>(null);
  const [aiGenerateProvider, setAiGenerateProvider] = useState('openai');
  const [aiGenerateModel, setAiGenerateModel] = useState('gpt-4o');
  const [aiGenerateParentId, setAiGenerateParentId] = useState<number>(0);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch collections when component mounts
  useEffect(() => {
    const loadCollections = async () => {
      console.log(user);
      if (!user?.id) return;
      
      try {
        console.log('Loading collections...');
        setLoading(true);
        setError(null);
        const data = await flashCardService.getCollectionsByUserId(user.id);
        console.log(data);
        setCollections(data);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to fetch collections');
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
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

  const fetchCollections = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await flashCardService.getCollectionsByUserId(user.id);
      setCollections(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.id || !formData.title.trim()) return;

    try {
      const createData: CreateFlashCardCollectionDto = {
        userId: user.id,
        parentId: selectedParentId || 0,
        title: formData.title,
        description: formData.description,
      };
      
      await flashCardService.createCollection(createData);
      await fetchCollections();
      setShowCreateModal(false);
      setFormData({ title: '', description: '' });
      setSelectedParentId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create collection');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCollection || !formData.title.trim()) return;

    try {
      await flashCardService.updateCollection(selectedCollection.id, {
        title: formData.title,
        description: formData.description,
      });
      await fetchCollections();
      setShowEditModal(false);
      setSelectedCollection(null);
      setFormData({ title: '', description: '' });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update collection');
    }
  };

  const handleDelete = async () => {
    if (!selectedCollection) return;

    try {
      await flashCardService.deleteCollection(selectedCollection.id);
      await fetchCollections();
      setShowDeleteModal(false);
      setSelectedCollection(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete collection');
    }
  };

  const openCreateModal = (parentId: number | null = null) => {
    setSelectedParentId(parentId);
    setFormData({ title: '', description: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (collection: FlashCardCollection) => {
    setSelectedCollection(collection);
    setFormData({
      title: collection.title,
      description: collection.description,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (collection: FlashCardCollection) => {
    setSelectedCollection(collection);
    setShowDeleteModal(true);
  };

  const toggleExpanded = (collectionId: number) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  // AI Generate handlers
  const openAIGenerateModal = () => {
    setAiGenerateFile(null);
    setAiGenerateProvider('openai');
    setAiGenerateModel('gpt-4o');
    setAiGenerateParentId(0);
    setAiGenerateError(null);
    setShowAIGenerateModal(true);
  };

  const closeAIGenerateModal = () => {
    if (aiGenerating) return; // Prevent closing while generating
    setShowAIGenerateModal(false);
    setAiGenerateFile(null);
    setAiGenerateError(null);
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

  const handleAIGenerate = async () => {
    if (!user?.id || !aiGenerateFile) return;

    try {
      setAiGenerating(true);
      setAiGenerateError(null);

      const result = await aiGenerationService.generateFlashCards({
        file: aiGenerateFile,
        parentCollectionId: aiGenerateParentId,
        userId: user.id,
        provider: aiGenerateProvider,
        model: aiGenerateModel,
      });

      setShowAIGenerateModal(false);
      setAiGenerateFile(null);
      setSuccessMessage(
        `✅ Collection "${result.collection.title}" with ${result.flashCards.length} flashcard${result.flashCards.length !== 1 ? 's' : ''} has been created!`
      );
      await fetchCollections();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setAiGenerateError(
        error.response?.data?.message || 'Failed to generate flashcards. Please try again.'
      );
    } finally {
      setAiGenerating(false);
    }
  };

  // Get root collections (no parent)
  const rootCollections = collections.filter(c => c.parentId === null);

  // Get children for a specific parent
  const getChildren = (parentId: number) => {
    return collections.filter(c => c.parentId === parentId);
  };

  // Render collection item with children recursively
  const renderCollection = (collection: FlashCardCollection, level: number = 0) => {
    const children = getChildren(collection.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCollections.has(collection.id);

    return (
      <div key={collection.id} className="mb-2" style={{ marginLeft: level > 0 ? `${level * 2}rem` : '0' }}>
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(collection.id)}
                    className="focus:outline-none"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg
                      className={`w-5 h-5 text-indigo-600 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">{collection.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCreateModal(collection.id)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Add Subfolder"
                    >
                      + Subfolder
                    </button>
                    <button
                      onClick={() => openEditModal(collection)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      title="Edit Collection"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => openDeleteModal(collection)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete Collection"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{collection.description}</p>
                <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                  <span>📇 {collection.flashCardCount} cards</span>
                  <span>📁 {collection.childrenCount} folders</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {!hasChildren && (
                <button
                  onClick={() => navigate(`/flashcards/${collection.id}`)}
                  className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  title="Manage flashcards"
                >
                  ✏️ Edit Cards
                </button>
              )}
              <button
                onClick={() => navigate(`/learn/${collection.id}`)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                title="Start learning"
              >
                📚 Learn
              </button>
            </div>
          </div>
        </div>
        {hasChildren && (
          <div
            className="transition-[opacity,transform] overflow-auto"
            style={{
              maxHeight: isExpanded ? '5000px' : '0px',
              opacity: isExpanded ? 1 : 0,
              transitionDuration: `${ANIMATION_DURATION.NORMAL}ms`,
            }}
          >
            <div className="mt-2">
              {children.map(child => renderCollection(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          FlashCard Collections
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openAIGenerateModal}
            className="px-4 py-2 text-white rounded-lg transition-all hover:shadow-lg font-medium"
            style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            title="Generate flashcards from a document using AI"
          >
            ✨ AI Generate
          </button>
          <button
            onClick={() => openCreateModal(null)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Collection
          </button>
        </div>
      </div>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading collections...</div>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Collections Yet</h3>
          <p className="text-gray-600 mb-4">Create your first flashcard collection to get started!</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={openAIGenerateModal}
              className="px-6 py-2 text-white rounded-lg transition-all hover:shadow-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
            >
              ✨ AI Generate
            </button>
            <button
              onClick={() => openCreateModal(null)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {rootCollections.map(collection => renderCollection(collection))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedParentId ? 'Create Subfolder' : 'Create Collection'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', description: '' });
                  setSelectedParentId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Collection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCollection(null);
                  setFormData({ title: '', description: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Collection</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{selectedCollection.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCollection(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            {/* Loading Overlay */}
            {aiGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Generating flashcards...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-1">✨ AI Generate Flashcards</h2>
            <p className="text-sm text-gray-500 mb-5">Upload a document and let AI create flashcards for you</p>

            <div className="space-y-4">
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
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
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
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>

              {/* Provider & Model in a 2-column layout */}
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
                disabled={!aiGenerateFile || aiGenerating}
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

export default CollectionPage;
