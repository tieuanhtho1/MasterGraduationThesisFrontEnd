import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashCardService } from '../services/flashCardService';
import type { FlashCardCollection, CreateFlashCardCollectionDto } from '../types';
import { ANIMATION_DURATION } from '../constants/animations';

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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

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

  const toggleMenu = (collectionId: number) => {
    setOpenMenuId(prev => prev === collectionId ? null : collectionId);
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
                <h3 className="text-lg font-semibold text-gray-800">{collection.title}</h3>
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
                  ✏️ Edit
                </button>
              )}
              <button
                onClick={() => navigate(`/learn/${collection.id}`)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                title="Start learning"
              >
                📚 Learn
              </button>
              <div className="relative">
                <button
                  onClick={() => toggleMenu(collection.id)}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="More options"
                >
                  ⋮
                </button>
                {openMenuId === collection.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      type='button'
                      onClick={() => {
                        openCreateModal(collection.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                    >
                      + Add Subfolder
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        openEditModal(collection);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        openDeleteModal(collection);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
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
        <button
          onClick={() => openCreateModal(null)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Collection
        </button>
      </div>

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
          <button
            onClick={() => openCreateModal(null)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Collection
          </button>
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
    </div>
  );
};

export default CollectionPage;
