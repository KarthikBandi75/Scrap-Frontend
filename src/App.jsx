import { useState } from 'react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`https://scrap-backend-iwou.onrender.com/api/leads`, { query, location });
      const formattedLeads = response.data.map((lead) => ({
        name: lead.name || 'Unknown',
        address: lead.address || 'Address not available',
        phone: lead.phone || 'Phone not available',
        website: lead.website || '',
        summary: lead.summary || 'No summary available.',
      }));
      setLeads(formattedLeads);
    } catch (err) {
      setError('Error fetching leads. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Lead Generator
        </h1>
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
            <input
              type="text"
              placeholder="Search query (e.g., restaurants, cafes)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              required
            />
            <input
              type="text"
              placeholder="Location (e.g., Tirupati, India)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-red-600 bg-red-100 p-4 rounded-lg mb-6 text-center font-medium">
            {error}
          </p>
        )}
        {leads.length === 0 && !loading && !error && (
          <p className="text-gray-600 text-center text-lg">
            Enter a query and location to search for leads.
          </p>
        )}
        {leads.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Website</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Summary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{lead.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate block max-w-xs"
                        >
                          {lead.website}
                        </a>
                      ) : (
                        'No website'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">{lead.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
