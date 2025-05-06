import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const suggestionListRef = useRef(null);
  const inputRef = useRef(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const isSubmitting = useRef(false);

  
  const isGoogleMapsUrl = (url) => {
    const isUrl = (
      url.startsWith('https://g.co/kgs/') ||
      url.includes('google.com/maps/') ||
      url.startsWith('https://maps.app.goo.gl/')
    );
    return isUrl;
  };

 
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.trim().length > 2 && !isSubmitting.current && !isGoogleMapsUrl(searchQuery)) {
        try {
          setError('');
          const response = await axios.get('https://scrap-backend-iwou.onrender.com/api/suggestions', {
            params: { query: searchQuery },
          });
          setSuggestions(response.data);
          setFocusedSuggestionIndex(-1);
          setShowEmptyState(false);
        } catch (err) {
          setError('Failed to load suggestions. Please try again.');
          setSuggestions([]);
          setShowEmptyState(true);
        }
      } else {
        setSuggestions([]);
        setShowEmptyState(searchQuery.trim().length === 0);
      }
    }, 300),
    []
  );

  
  useEffect(() => {
    if (query.trim()) {
      fetchSuggestions(query);
      setShowEmptyState(false);
    } else {
      setSuggestions([]);
      setFocusedSuggestionIndex(-1);
      setShowEmptyState(true);
    }
    return () => fetchSuggestions.cancel();
  }, [query, fetchSuggestions]);

  
  const handleKeyDown = (e) => {
    if (!suggestions.length || isSubmitting.current) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[focusedSuggestionIndex]);
    } else if (e.key === 'Enter' && !loading && !isSubmitting.current) {
      e.preventDefault();
      handleSearch(e);
    }
  };

 
  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading || isSubmitting.current) return;

      isSubmitting.current = true;
      setError('');

      if (!query.trim()) {
        setError('Please enter a place name or Google Maps link.');
        isSubmitting.current = false;
        return;
      }

      if (!isGoogleMapsUrl(query) && !selectedPlace) {
        setError('Please select a place from suggestions or enter a valid Google Maps link.');
        isSubmitting.current = false;
        return;
      }

      setLoading(true);
      setReviews([]);
      setBusinessInfo(null);
      setSuggestions([]);
      setShowEmptyState(false);

      try {
        const placeId = selectedPlace ? selectedPlace.place_id : query;
        const response = await axios.post('https://scrap-backend-iwou.onrender.com/api/reviews', { placeId });
         console.log(response.data);
        if (!response.data.reviews || response.data.reviews.length === 0) {
          setError(response.data.message || 'Could not find the specified place or no reviews available.');
          setLoading(false);
          isSubmitting.current = false;
          return;
        }

        setReviews(response.data.reviews);
        setBusinessInfo(response.data.place_info || null);
        if (response.data.reviews.length <= 8) {
          setError('Only a limited number of reviews are available due to API restrictions.');
        }
        setQuery('');
        setSelectedPlace(null);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Failed to fetch reviews. Please check the place name or URL and try again.'
        );
      } finally {
        setLoading(false);
        isSubmitting.current = false;
      }
    },
    [query, selectedPlace, loading]
  );

  const selectSuggestion = (suggestion) => {
    if (!suggestion?.title) {
      setError('Invalid selection. Please try again.');
      return;
    }
    setQuery(suggestion.title);
    setSelectedPlace(suggestion);
    setSuggestions([]);
    setFocusedSuggestionIndex(-1);
    inputRef.current.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-teal-600 text-center mb-8 sm:mb-12">
          Google Maps Review Scraper
        </h1>
        
        <form onSubmit={handleSearch} className="mb-8 relative">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a place or enter Google Maps link"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedPlace(null);
                }}
                onKeyDown={handleKeyDown}
                className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search for a place"
                disabled={loading || isSubmitting.current}
              />
              
              {suggestions.length > 0 && (
                <ul
                  ref={suggestionListRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className={`p-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                        index === focusedSuggestionIndex ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => setFocusedSuggestionIndex(index)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-medium">{suggestion.title}</p>
                          <p className="text-sm text-gray-500">{suggestion.address}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || isSubmitting.current || !query.trim()}
              className="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 min-w-[150px] cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                  </svg>
                  Fetching...
                </span>
              ) : (
                'Scrape Reviews'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {showEmptyState && !loading && !error && (
          <div className="text-center p-8 bg-white rounded-lg shadow mb-7">
            <p className="text-gray-600">
              Enter a place name or Google Maps link to begin
            </p>
          </div>
        )}

        {reviews.length === 0 && !showEmptyState && !loading && !error && (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">
              No results found
            </p>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            {businessInfo && (
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-semibold">{businessInfo.title}</h2>
                <p className="text-gray-600 mt-1">{businessInfo.address}</p>
                {businessInfo.rating && (
                  <p className="text-gray-600 mt-2">
                    Rating: {businessInfo.rating} ({businessInfo.reviews} reviews)
                  </p>
                )}
              </div>
            )}

            <h3 className="text-xl font-semibold mb-4">
              Reviews ({reviews.length})
            </h3>

            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{review.time}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{review.text}</p>
                  <p className="text-sm text-gray-500">— {review.author}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
