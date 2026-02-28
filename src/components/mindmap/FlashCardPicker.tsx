import { useState, useEffect, useCallback, useTransition, memo, type FC } from 'react';
import { useAuthStore } from '../../store/authStore';
import { flashCardService } from '../../services/flashCardService';
import type { FlashCard } from '../../types';
import Modal from '../common/Modal';

// Stable empty set — avoids creating a new reference on every render
const EMPTY_SET = new Set<number>();

interface FlashCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (flashCard: FlashCard) => void;
  /** The mind map's default collection — only cards from this collection are shown */
  defaultCollectionId?: number;
  /** Display name for the locked collection */
  defaultCollectionTitle?: string;
  /** Already-used flash card ids — disable these */
  usedFlashCardIds?: Set<number>;
}

// ---------------------------------------------------------------------------
// SearchInput — owns its own local state so keystrokes never re-render the
// parent. Calls onSearch only after the user stops typing (300 ms debounce).
// ---------------------------------------------------------------------------
interface SearchInputProps {
  onSearch: (text: string) => void;
}

const SearchInput: FC<SearchInputProps> = memo(({ onSearch }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <input
      type="text"
      placeholder="Search flash cards…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  );
});

// ---------------------------------------------------------------------------
// FlashCardList — wrapped in memo so it only re-renders when the API data or
// the used-ids set actually changes, not on every parent state update.
// ---------------------------------------------------------------------------
interface FlashCardListProps {
  flashCards: FlashCard[];
  loadingCards: boolean;
  isPending: boolean;
  defaultCollectionId?: number;
  usedFlashCardIds: Set<number>;
  onSelect: (card: FlashCard) => void;
}

const FlashCardList: FC<FlashCardListProps> = memo(
  ({ flashCards, loadingCards, isPending, defaultCollectionId, usedFlashCardIds, onSelect }) => {
    const isLoading = loadingCards || isPending;
    return (
    <div className={`max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 transition-opacity duration-150 ${isLoading && flashCards.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
      {!defaultCollectionId ? (
        <div className="p-6 text-center text-gray-400">No collection assigned to this mind map</div>
      ) : isLoading && flashCards.length === 0 ? (
        <div className="p-6 text-center text-gray-400">Loading cards…</div>
      ) : flashCards.length === 0 ? (
        <div className="p-6 text-center text-gray-400">No flash cards found</div>
      ) : (
        flashCards.map((card) => {
          const used = usedFlashCardIds.has(card.id);
          return (
            <button
              key={card.id}
              disabled={used}
              onClick={() => onSelect(card)}
              className={`w-full text-left px-4 py-3 transition ${
                used
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-indigo-50 cursor-pointer'
              }`}
            >
              <p className="font-medium text-sm">{card.term}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{card.definition}</p>
              {used && <span className="text-xs text-gray-400 italic">Already in mind map</span>}
            </button>
          );
        })
      )}
    </div>
    );
  },
);

// ---------------------------------------------------------------------------
// FlashCardPicker — orchestrator. State here only changes when the API
// responds, keeping renders to a minimum.
// ---------------------------------------------------------------------------
const FlashCardPicker: FC<FlashCardPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  defaultCollectionId,
  defaultCollectionTitle,
  usedFlashCardIds = EMPTY_SET,
}) => {
  const user = useAuthStore((s) => s.user);
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Load flash cards — only fires when searchQuery (debounced) changes
  useEffect(() => {
    if (!isOpen || !defaultCollectionId || !user?.id) {
      setFlashCards([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingCards(true);
      try {
        const data = await flashCardService.getFlashCardsByCollection(
          defaultCollectionId,
          1,
          200,
          searchQuery || undefined,
        );
        if (!cancelled) setFlashCards(data.flashCards);
      } catch {
        if (!cancelled) setFlashCards([]);
      } finally {
        if (!cancelled) setLoadingCards(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, defaultCollectionId, user?.id, searchQuery]);

  // Stable callbacks — prevent memo'd children from re-rendering due to
  // new function references on each parent render
  const handleSearch = useCallback((text: string) => {
    startTransition(() => setSearchQuery(text));
  }, []);
  const handleSelect = useCallback((card: FlashCard) => onSelect(card), [onSelect]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Flash Card as Node" size="lg">
      <div className="space-y-4">
        {/* Locked collection badge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
          {defaultCollectionId ? (
            <div className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 font-medium">
              {defaultCollectionTitle || `Collection #${defaultCollectionId}`}
            </div>
          ) : (
            <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 italic">
              No default collection set for this mind map
            </div>
          )}
        </div>

        {/* Search — isolated; keystrokes stay inside SearchInput */}
        {defaultCollectionId && <SearchInput onSearch={handleSearch} />}

        {/* Flash card list — only re-renders when API data changes */}
        <FlashCardList
          flashCards={flashCards}
          loadingCards={loadingCards}
          isPending={isPending}
          defaultCollectionId={defaultCollectionId}
          usedFlashCardIds={usedFlashCardIds}
          onSelect={handleSelect}
        />
      </div>
    </Modal>
  );
};

export default FlashCardPicker;
