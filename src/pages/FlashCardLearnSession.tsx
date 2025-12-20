import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { flashCardService } from '../services/flashCardService';
import type { FlashCard } from '../types';

interface FlashCardWithHistory extends FlashCard {
  totalScoreModification: number;
  lastTwoScores: number[];
  isRemembered: boolean;
  timesLearned: number;
}

const SCORE_RANGE = 5;
const CARDS_PER_SESSION = 10;

const FlashCardLearnSession = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  
  // Session state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<FlashCardWithHistory[]>([]);
  const [currentCards, setCurrentCards] = useState<FlashCardWithHistory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize session
  useEffect(() => {
    const fetchSession = async () => {
      if (!collectionId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await flashCardService.getLearnSession(
          parseInt(collectionId), 
          CARDS_PER_SESSION
        );
        
        const cardsWithHistory: FlashCardWithHistory[] = data.flashCards.map(card => ({
          ...card,
          totalScoreModification: 0,
          lastTwoScores: [],
          isRemembered: false,
          timesLearned: 0,
        }));
        
        const shuffled = shuffleArray(cardsWithHistory);
        setAllCards(shuffled);
        setCurrentCards(shuffled.filter(c => !c.isRemembered));
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to fetch learn session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [collectionId]);

  // Handle scoring
  const handleScore = (score: number) => {
    const updatedCards = [...allCards];
    const currentCard = currentCards[currentIndex];
    const cardIndex = updatedCards.findIndex(c => c.id === currentCard.id);
    
    if (cardIndex !== -1) {
      // Update score tracking
      updatedCards[cardIndex].totalScoreModification += score;
      updatedCards[cardIndex].lastTwoScores.push(score);
      updatedCards[cardIndex].timesLearned += 1;
      
      // Keep only last two scores
      if (updatedCards[cardIndex].lastTwoScores.length > 2) {
        updatedCards[cardIndex].lastTwoScores.shift();
      }
      
      // Check if card should be marked as remembered
      const lastTwo = updatedCards[cardIndex].lastTwoScores;
      if (lastTwo.length === 2 && lastTwo[0] > 0 && lastTwo[1] > 0) {
        updatedCards[cardIndex].isRemembered = true;
      }
      
      setAllCards(updatedCards);
    }
    
    // Trigger slide out animation
    setIsTransitioning(true);
    
    // Wait for animation then move to next card
    setTimeout(() => {
      // Move to next card or end loop
      if (currentIndex < currentCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // End of loop - check if any cards remain
        const remainingCards = updatedCards.filter(c => !c.isRemembered);
        
        if (remainingCards.length === 0) {
          // All cards remembered - show review
          setSessionComplete(true);
        } else {
          // Shuffle remaining cards and restart loop
          const shuffled = shuffleArray(remainingCards);
          setCurrentCards(shuffled);
          setCurrentIndex(0);
          setIsFlipped(false);
        }
      }
      
      // Reset transition state after card change
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  // Handle card reselection from review
  const handleToggleRelearn = (cardId: number) => {
    const updatedCards = allCards.map(card =>
      card.id === cardId ? { ...card, isRemembered: !card.isRemembered } : card
    );
    setAllCards(updatedCards);
  };

  // Continue learning after review
  const handleContinueLearning = () => {
    const remainingCards = allCards.filter(c => !c.isRemembered);
    if (remainingCards.length > 0) {
      const shuffled = shuffleArray(remainingCards);
      setCurrentCards(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
    }
  };

  // Handle exit with confirmation
  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    navigate('/dashboard');
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // Submit scores and end session
  const handleEndSession = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const scoreUpdates = allCards
        .filter(card => card.totalScoreModification !== 0)
        .map(card => ({
          flashCardId: card.id,
          scoreModification: card.totalScoreModification,
          TimesLearned: card.timesLearned,
        }));
      
      if (scoreUpdates.length > 0) {
        await flashCardService.updateScores({ scoreUpdates });
      }
      
      // Navigate back or show success
      navigate('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update scores');
    } finally {
      setSubmitting(false);
    }
  };

  // Render score buttons
  const renderScoreButtons = () => {
    const buttons = [];
    for (let i = -SCORE_RANGE; i <= SCORE_RANGE; i++) {
      if (i === 0) continue;
      buttons.push(
        <button
          key={i}
          onClick={() => handleScore(i)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            i > 0
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {i > 0 ? `+${i}` : i}
        </button>
      );
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-xl">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Back to Collections
        </button>
      </div>
    );
  }

  // Session complete - review screen
  if (sessionComplete) {
    const notRememberedCards = allCards.filter(c => !c.isRemembered);

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Session Review
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            Great job! You've completed the session.
          </h2>
          <p className="text-gray-600 mb-4">
            Review your flashcards below. Click on any card you want to practice again.
          </p>

          <div className="space-y-4">
            {allCards.map(card => (
              <div
                key={card.id}
                onClick={() => handleToggleRelearn(card.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  card.isRemembered
                    ? 'border-green-300 bg-green-50'
                    : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{card.term}</p>
                    <p className="text-gray-600 text-sm">{card.definition}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`font-bold ${
                      card.totalScoreModification >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.totalScoreModification >= 0 ? '+' : ''}
                      {card.totalScoreModification}
                    </p>
                    <p className="text-sm text-gray-500">
                      {card.isRemembered ? '✓ Remembered' : '↻ Practice again'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            {notRememberedCards.length > 0 && (
              <button
                onClick={handleContinueLearning}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
              >
                Continue Learning ({notRememberedCards.length} cards)
              </button>
            )}
            <button
              onClick={handleEndSession}
              disabled={submitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'End Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Learning mode
  if (currentCards.length === 0 || !currentCards[currentIndex]) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">
          No cards available for this session.
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Back to Collections
        </button>
      </div>
    );
  }

  const currentCard = currentCards[currentIndex];
  const progress = allCards.filter(c => c.isRemembered).length;
  const total = allCards.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Learn Session</h1>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {progress} / {total} remembered</span>
          <span>Current loop: {currentIndex + 1} / {currentCards.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(progress / total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-6 overflow-hidden">
        <div
          onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}
          className={`relative cursor-pointer ${isTransitioning ? 'pointer-events-none' : ''}`}
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative duration-500"
            style={{
              transformStyle: 'preserve-3d',
              minHeight: '300px',

              // Flip + slide animation
              transform: `
                rotateX(${isFlipped ? 180 : 0}deg)
                translateX(${isTransitioning ? '100%' : '0'})
              `,
              opacity: isTransitioning ? 0 : 1,

              // Explicit transitions only
              transition: isTransitioning
                ? 'transform 0.3s ease-in, opacity 0.3s ease-in'
                : 'transform 0.5s ease',
            }}
          >
            {/* Front — Term */}
            <div
              className="absolute inset-0 bg-white rounded-lg shadow-lg p-8 flex items-center justify-center"
              style={{
                minHeight: '300px',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-800">
                  {currentCard.term}
                </p>
              </div>
            </div>

            {/* Back — Definition */}
            <div
              className="absolute inset-0 bg-blue-50 rounded-lg shadow-lg p-8 flex items-center justify-center"
              style={{
                minHeight: '300px',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateX(180deg)',
              }}
            >
              <div className="text-center">
                {/* <p className="text-sm text-gray-500 mb-4">Definition</p> */}
                <p className="text-3xl font-semibold text-gray-800">
                  {currentCard.definition}
                </p>
                {/* <p className="text-sm text-gray-400 mt-8">
                  Click to flip
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600 mb-4 font-semibold">
          How well do you know this card?
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {renderScoreButtons()}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Negative scores for cards you don't know well, positive for cards you know well
        </p>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Exit Session?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit? Your progress will not be saved.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={cancelExit}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCardLearnSession;
