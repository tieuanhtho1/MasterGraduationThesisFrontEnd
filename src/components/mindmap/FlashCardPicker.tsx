import { useState, useEffect, type FC } from 'react';
import { useAuthStore } from '../../store/authStore';
import { flashCardService } from '../../services/flashCardService';
import type { FlashCardCollection, FlashCard } from '../../types';
import Modal from '../common/Modal';

interface FlashCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (flashCard: FlashCard) => void;
  /** Pre-selected collection id (mind map's default collection) */
  defaultCollectionId?: number;
  /** Already-used flash card ids — disable these */
  usedFlashCardIds?: Set<number>;
}

const FlashCardPicker: FC<FlashCardPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  defaultCollectionId,
  usedFlashCardIds = new Set(),
}) => {
  const user = useAuthStore((s) => s.user);
  const [collections, setCollections] = useState<FlashCardCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number>(defaultCollectionId || 0);
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load collections once
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const load = async () => {
      setLoadingCollections(true);
      try {
        const data = await flashCardService.getCollectionsByUserId(user.id);
        setCollections(data);
        if (defaultCollectionId) {
          setSelectedCollectionId(defaultCollectionId);
        }
      } catch {
        // ignore
      } finally {
        setLoadingCollections(false);
      }
    };
    load();
  }, [isOpen, user?.id, defaultCollectionId]);

  // Load flash cards when collection changes
  useEffect(() => {
    if (!selectedCollectionId) {
      setFlashCards([]);
      return;
    }
    const load = async () => {
      setLoadingCards(true);
      try {
        const data = await flashCardService.getFlashCardsByCollection(selectedCollectionId, 1, 200, searchText || undefined);
        setFlashCards(data.flashCards);
      } catch {
        setFlashCards([]);
      } finally {
        setLoadingCards(false);
      }
    };
    load();
  }, [selectedCollectionId, searchText]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Flash Card as Node" size="lg">
      <div className="space-y-4">
        {/* Collection selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
          {loadingCollections ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : (
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={0}>Select a collection…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.flashCardCount} cards)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search */}
        {selectedCollectionId > 0 && (
          <input
            type="text"
            placeholder="Search flash cards…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}

        {/* Flash card list */}
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {loadingCards ? (
            <div className="p-6 text-center text-gray-400">Loading cards…</div>
          ) : flashCards.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              {selectedCollectionId ? 'No flash cards found' : 'Select a collection first'}
            </div>
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
      </div>
    </Modal>
  );
};

export default FlashCardPicker;
