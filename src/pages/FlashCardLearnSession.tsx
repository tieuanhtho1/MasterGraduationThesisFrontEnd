import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { flashCardService } from '../services/flashCardService';
import type { FlashCardCollection } from '../types';

const FlashCardLearnSession = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<FlashCardCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await flashCardService.getCollectionById(parseInt(collectionId));
        setCollection(data);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to fetch collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Learn Session
        </h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Back to Collections
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : collection ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Collection: {collection.title}
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Collection ID: {collection.id}
            </p>
            {collection.description && (
              <p className="text-gray-600 mt-4">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          Collection not found
        </div>
      )}
    </div>
  );
};

export default FlashCardLearnSession;
