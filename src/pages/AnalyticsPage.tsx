import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '../store/authStore';
import type { UserAnalytics, CollectionAnalytics } from '../types';

const AnalyticsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionAnalytics, setCollectionAnalytics] = useState<CollectionAnalytics | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getUserAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionAnalytics = async (collectionId: number) => {
    if (!user?.id) return;

    try {
      setLoadingCollection(true);
      setCollectionError(null);
      setSelectedCollectionId(collectionId);
      const data = await analyticsService.getCollectionAnalytics(user.id, collectionId);
      setCollectionAnalytics(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setCollectionError(error.response?.data?.message || 'Failed to load collection analytics');
      console.error('Error loading collection analytics:', err);
    } finally {
      setLoadingCollection(false);
    }
  };

  const closeCollectionModal = () => {
    setSelectedCollectionId(null);
    setCollectionAnalytics(null);
    setCollectionError(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
        <p className="text-gray-600">No analytics data available.</p>
      </div>
    );
  }

  const { overview, learningProgress, topCollections, averageScoreDistribution } = analytics;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your learning progress and performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Collections</p>
              <p className="text-2xl font-bold text-gray-800">{overview.totalCollections}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Cards</p>
              <p className="text-2xl font-bold text-gray-800">{overview.totalFlashCards}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cards Learned</p>
              <p className="text-2xl font-bold text-gray-800">{overview.totalFlashCardsLearned}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-gray-800">{overview.averageScore.toFixed(1)}%</p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Learning Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Progress</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">To Review</span>
              <span className="text-lg font-semibold text-gray-700">{learningProgress.cardsToReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mastered</span>
              <span className="text-lg font-semibold text-green-600">{learningProgress.cardsMastered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-lg font-semibold text-yellow-600">{learningProgress.cardsInProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Need Work</span>
              <span className="text-lg font-semibold text-red-600">{learningProgress.cardsNeedWork}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-lg font-bold text-blue-600">{learningProgress.completionRate.toFixed(1)}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${learningProgress.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Average Score Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">-5 to -3 (Needs Work)</span>
                <span className="text-sm font-semibold text-red-600">{averageScoreDistribution.scoreMinus5ToMinus3}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(averageScoreDistribution.scoreMinus5ToMinus3 / overview.totalFlashCards) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">-3 to -1</span>
                <span className="text-sm font-semibold text-orange-600">{averageScoreDistribution.scoreMinus3ToMinus1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(averageScoreDistribution.scoreMinus3ToMinus1 / overview.totalFlashCards) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">-1 to 1 (In Progress)</span>
                <span className="text-sm font-semibold text-yellow-600">{averageScoreDistribution.scoreMinus1To1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(averageScoreDistribution.scoreMinus1To1 / overview.totalFlashCards) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">1 to 3</span>
                <span className="text-sm font-semibold text-blue-600">{averageScoreDistribution.score1To3}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(averageScoreDistribution.score1To3 / overview.totalFlashCards) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">3 to 5 (Mastered)</span>
                <span className="text-sm font-semibold text-green-600">{averageScoreDistribution.score3To5}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(averageScoreDistribution.score3To5 / overview.totalFlashCards) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Collections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Collections</h2>
        {topCollections.length === 0 ? (
          <p className="text-gray-600">No collections with learning activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Learned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCollections.map((collection) => (
                  <tr 
                    key={collection.collectionId} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadCollectionAnalytics(collection.collectionId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">{collection.collectionTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{collection.flashCardCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{collection.cardsLearned}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{collection.averageScore.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px] mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${collection.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{collection.completionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collection Analytics Modal */}
      {selectedCollectionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {collectionAnalytics?.collectionTitle || 'Collection Analytics'}
              </h2>
              <button
                onClick={closeCollectionModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingCollection && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {collectionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{collectionError}</p>
                </div>
              )}

              {collectionAnalytics && !loadingCollection && (
                <div className="space-y-6">
                  {/* Collection Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800">{collectionAnalytics.description || 'No description'}</p>
                  </div>

                  {/* Collection Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Cards</p>
                      <p className="text-2xl font-bold text-blue-600">{collectionAnalytics.totalFlashCards}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Cards Learned</p>
                      <p className="text-2xl font-bold text-green-600">{collectionAnalytics.flashCardsLearned}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                      <p className="text-2xl font-bold text-purple-600">{collectionAnalytics.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Completion</p>
                      <p className="text-2xl font-bold text-indigo-600">{collectionAnalytics.completionRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Average Score Distribution</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">-5 to -3 (Needs Work)</span>
                          <span className="text-sm font-semibold text-red-600">{collectionAnalytics.averageScoreDistribution.scoreMinus5ToMinus3}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: collectionAnalytics.totalFlashCards > 0 ? `${(collectionAnalytics.averageScoreDistribution.scoreMinus5ToMinus3 / collectionAnalytics.totalFlashCards) * 100}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">-3 to -1</span>
                          <span className="text-sm font-semibold text-orange-600">{collectionAnalytics.averageScoreDistribution.scoreMinus3ToMinus1}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: collectionAnalytics.totalFlashCards > 0 ? `${(collectionAnalytics.averageScoreDistribution.scoreMinus3ToMinus1 / collectionAnalytics.totalFlashCards) * 100}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">-1 to 1 (In Progress)</span>
                          <span className="text-sm font-semibold text-yellow-600">{collectionAnalytics.averageScoreDistribution.scoreMinus1To1}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: collectionAnalytics.totalFlashCards > 0 ? `${(collectionAnalytics.averageScoreDistribution.scoreMinus1To1 / collectionAnalytics.totalFlashCards) * 100}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">1 to 3</span>
                          <span className="text-sm font-semibold text-blue-600">{collectionAnalytics.averageScoreDistribution.score1To3}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: collectionAnalytics.totalFlashCards > 0 ? `${(collectionAnalytics.averageScoreDistribution.score1To3 / collectionAnalytics.totalFlashCards) * 100}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">3 to 5 (Mastered)</span>
                          <span className="text-sm font-semibold text-green-600">{collectionAnalytics.averageScoreDistribution.score3To5}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: collectionAnalytics.totalFlashCards > 0 ? `${(collectionAnalytics.averageScoreDistribution.score3To5 / collectionAnalytics.totalFlashCards) * 100}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Performing Cards */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Performing Cards</h3>
                      {collectionAnalytics.topPerformingCards.length === 0 ? (
                        <p className="text-gray-600 text-sm">No cards studied yet</p>
                      ) : (
                        <div className="space-y-2">
                          {collectionAnalytics.topPerformingCards.map((card) => (
                            <div key={card.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{card.term}</span>
                                <span className="text-sm font-semibold text-green-600">{card.score}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Studied {card.timesLearned} times</span>
                                <span>Avg: {card.averageScore.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cards Needing Review */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Cards Needing Review</h3>
                      {collectionAnalytics.cardsNeedingReview.length === 0 ? (
                        <p className="text-gray-600 text-sm">No cards that need reviewing!</p>
                      ) : (
                        <div className="space-y-2">
                          {collectionAnalytics.cardsNeedingReview.map((card) => (
                            <div key={card.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{card.term}</span>
                                <span className="text-sm font-semibold text-red-600">{card.score}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Studied {card.timesLearned} times</span>
                                <span>Avg: {card.averageScore.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeCollectionModal}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

