import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { flashCardService } from '../services/flashCardService';
import type { FlashCard } from '../types';

interface FlashCardWithChanges extends FlashCard {
  isNew?: boolean;
  isModified?: boolean;
}

const FlashCardEditPage = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  
  const [flashCards, setFlashCards] = useState<FlashCardWithChanges[]>([]);
  const [originalFlashCards, setOriginalFlashCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchFlashCards = async (search?: string) => {
    if (!collectionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await flashCardService.getFlashCardsByCollection(
        parseInt(collectionId),
        pageNumber,
        pageSize,
        search || undefined
      );
      setFlashCards(response.flashCards);
      setOriginalFlashCards(JSON.parse(JSON.stringify(response.flashCards)));
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  };

  // Fetch flashcards
  useEffect(() => {
    if (collectionId) {
      fetchFlashCards(searchText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, pageNumber, pageSize]);

  // Add new flashcard
  const handleAddFlashCard = () => {
    const newCard: FlashCardWithChanges = {
      id: Date.now(), // Temporary ID for new cards
      term: '',
      definition: '',
      score: 0,
      flashCardCollectionId: parseInt(collectionId!),
      isNew: true,
      isModified: true,
    };
    setFlashCards([...flashCards, newCard]);
  };

  // Update flashcard field
  const handleUpdateFlashCard = (id: number, field: keyof FlashCard, value: string | number) => {
    setFlashCards(cards =>
      cards.map(card => {
        if (card.id === id) {
          const updated = { ...card, [field]: value };
          // Mark as modified if not already new
          if (!card.isNew) {
            updated.isModified = true;
          }
          return updated;
        }
        return card;
      })
    );
  };

  // Remove flashcard (only for newly added cards)
  const handleRemoveFlashCard = (id: number) => {
    setFlashCards(cards => cards.filter(card => card.id !== id));
  };

  // Flip term and definition for a single card
  const handleFlipCard = (id: number) => {
    setFlashCards(cards =>
      cards.map(card => {
        if (card.id === id) {
          const updated = {
            ...card,
            term: card.definition,
            definition: card.term,
          };
          // Mark as modified if not already new
          if (!card.isNew) {
            updated.isModified = true;
          }
          return updated;
        }
        return card;
      })
    );
  };

  // Flip all cards in the current view
  const handleFlipAll = () => {
    setFlashCards(cards =>
      cards.map(card => {
        const updated = {
          ...card,
          term: card.definition,
          definition: card.term,
        };
        // Mark as modified if not already new
        if (!card.isNew) {
          updated.isModified = true;
        }
        return updated;
      })
    );
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(1); // Reset to first page when searching
    fetchFlashCards(searchText);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchText('');
    setPageNumber(1);
    fetchFlashCards('');
  };

  // Toggle card selection
  const toggleCardSelection = (id: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCards(newSelected);
  };

  // Select all cards on current page
  const handleSelectAll = () => {
    if (selectedCards.size === flashCards.filter(c => !c.isNew).length) {
      setSelectedCards(new Set());
    } else {
      const allIds = new Set(flashCards.filter(c => !c.isNew).map(c => c.id));
      setSelectedCards(allIds);
    }
  };

  // Bulk delete selected cards
  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedCards.size} flashcard(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setError(null);

      await flashCardService.bulkDeleteFlashCards(Array.from(selectedCards));

      // Clear selection and refresh
      setSelectedCards(new Set());
      await fetchFlashCards(searchText);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete flashcards');
    } finally {
      setDeleting(false);
    }
  };

  // Detect changes
  const getChangedFlashCards = (): FlashCard[] => {
    return flashCards
      .filter(card => {
        if (card.isNew) return true;
        if (!card.isModified) return false;
        
        // Find original card and compare
        const original = originalFlashCards.find(o => o.id === card.id);
        if (!original) return true;
        
        return (
          card.term !== original.term ||
          card.definition !== original.definition ||
          card.score !== original.score
        );
      })
      .map(card => ({
        id: card.isNew ? 0 : card.id,
        term: card.term,
        definition: card.definition,
        score: card.score,
        flashCardCollectionId: card.flashCardCollectionId,
      }));
  };

  // Save changes
  const handleSave = async () => {
    if (!collectionId) return;

    const changedCards = getChangedFlashCards();
    
    if (changedCards.length === 0) {
      setError('No changes to save');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await flashCardService.bulkUpdateFlashCards({
        flashCardCollectionId: parseInt(collectionId),
        flashCards: changedCards,
      });

      // Refresh the list
      await fetchFlashCards(searchText);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save flashcards');
    } finally {
      setSaving(false);
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(1); // Reset to first page when changing page size
  };

  const hasUnsavedChanges = getChangedFlashCards().length > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Flashcard Editor
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={handleAddFlashCard}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Flashcard
          </button>
          {selectedCards.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : `Delete Selected (${selectedCards.size})`}
            </button>
          )}
          <button
            onClick={handleFlipAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Flip term and definition for all cards"
          >
            ⇄ Flip All
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : `Save Changes${hasUnsavedChanges ? ` (${getChangedFlashCards().length})` : ''}`}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>

      {/* Search Bar and Page Size */}
      <div className="mb-6 space-y-3">
        <form onSubmit={handleSearch}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search flashcards by term or definition..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
            {searchText && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Items per page:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
              <option value={1000}>Show All</option>
            </select>
          </div>
          {flashCards.length > 0 && flashCards.some(c => !c.isNew) && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedCards.size === flashCards.filter(c => !c.isNew).length && flashCards.filter(c => !c.isNew).length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="selectAll" className="text-sm font-medium text-gray-700">
                Select All
              </label>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading flashcards...</div>
        </div>
      ) : (
        <>
          {/* Flashcard List */}
          <div className="space-y-4 mb-6">
            {flashCards.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Flashcards Yet</h3>
                <p className="text-gray-600 mb-4">Create your first flashcard to get started!</p>
                <button
                  onClick={handleAddFlashCard}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Flashcard
                </button>
              </div>
            ) : (
              flashCards.map((card, index) => {
                const isSelected = selectedCards.has(card.id);
                return (
                <div
                  key={card.id}
                  className={`bg-white border-2 rounded-lg p-3 ${
                    isSelected
                      ? 'border-red-400 bg-red-50'
                      : card.isNew || card.isModified
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {!card.isNew && (
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCards.has(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Delete</span>
                        </label>
                      )}
                      <span className="text-sm font-semibold text-gray-600">
                        #{index + 1 + (pageNumber - 1) * pageSize}
                      </span>
                      {card.isNew && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          New
                        </span>
                      )}
                      {card.isModified && !card.isNew && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                          Modified
                        </span>
                      )}
                      {selectedCards.has(card.id) && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Marked for Deletion
                        </span>
                      )}
                    </div>
                    {card.isNew && (
                      <button
                        onClick={() => handleRemoveFlashCard(card.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Term
                      </label>
                      <textarea
                        value={card.term}
                        onChange={(e) => handleUpdateFlashCard(card.id, 'term', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter term"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-start pt-6">
                      <button
                        onClick={() => handleFlipCard(card.id)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Flip term and definition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Definition
                      </label>
                      <textarea
                        value={card.definition}
                        onChange={(e) => handleUpdateFlashCard(card.id, 'definition', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter definition"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score
                      </label>
                      <input
                        type="number"
                        value={card.score}
                        onChange={(e) => handleUpdateFlashCard(card.id, 'score', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handlePreviousPage}
                  disabled={pageNumber === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={pageNumber === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pageNumber - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pageNumber * pageSize, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> flashcards
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={handlePreviousPage}
                      disabled={pageNumber === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {pageNumber} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={pageNumber === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashCardEditPage;
