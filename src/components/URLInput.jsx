import { useState } from 'react';

const URLInput = ({ onLoadDocument, recentDocuments = [] }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [useCorsProxy, setUseCorsProxy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setLoading(true);
    try {
      let finalUrl = url.trim();
      
      // Use CORS proxy if enabled
      if (useCorsProxy && !url.includes('cors-anywhere') && !url.includes('allorigins')) {
        finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.trim())}`;
      }
      
      await onLoadDocument(finalUrl);
      
      // Add to recent documents
      const docInfo = {
        url: url.trim(), // Store original URL
        title: extractTitleFromUrl(url.trim()),
        type: detectDocumentType(url.trim()),
        timestamp: Date.now()
      };
      
      const recent = JSON.parse(localStorage.getItem('recentDocuments') || '[]');
      const updated = [docInfo, ...recent.filter(d => d.url !== docInfo.url)].slice(0, 10);
      localStorage.setItem('recentDocuments', JSON.stringify(updated));
      
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = (docUrl) => {
    setUrl(docUrl);
    onLoadDocument(docUrl);
  };

  const detectDocumentType = (url) => {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const typeMap = {
      'pdf': 'PDF',
      'txt': 'Text',
      'md': 'Markdown',
      'markdown': 'Markdown',
      'html': 'HTML',
      'htm': 'HTML',
      'json': 'JSON',
      'xml': 'XML',
      'csv': 'CSV',
      'rtf': 'RTF',
      'doc': 'Word',
      'docx': 'Word'
    };
    return typeMap[extension] || 'Document';
  };

  const extractTitleFromUrl = (url) => {
    try {
      const filename = url.split('/').pop().split('?')[0];
      return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Document';
    } catch {
      return 'Document';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Input */}
        <div className="url-input-container mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Universal Document Reader</h1>
            <p className="text-gray-600">Load PDFs, articles, stories, and documents in any format from a URL</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter document URL (PDF, TXT, HTML, MD, CSV, JSON, etc.)"
              className="url-input"
              disabled={loading}
              required
            />
            
            {/* CORS Proxy Toggle */}
            <div className="mt-3 flex items-center justify-center space-x-2">
              <input
                type="checkbox"
                id="corsProxy"
                checked={useCorsProxy}
                onChange={(e) => setUseCorsProxy(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="corsProxy" className="text-sm text-gray-600">
                Use CORS proxy for blocked documents
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="load-pdf-btn"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2 h-4 w-4"></div>
                  Loading Document...
                </div>
              ) : (
                'Load Document'
              )}
            </button>
          </form>

          {/* Sample URLs */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Try these sample documents:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setUrl('https://www.gutenberg.org/files/64317/64317-0.txt')}
                className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 rounded transition-colors text-left"
              >
                <span className="font-medium">The Great Gatsby</span>
                <span className="block text-gray-500">Classic novel (TXT)</span>
              </button>
              <button
                onClick={() => setUrl('https://www.gutenberg.org/files/11/11-h/11-h.htm')}
                className="px-3 py-2 text-xs bg-green-50 hover:bg-green-100 rounded transition-colors text-left"
              >
                <span className="font-medium">Alice in Wonderland</span>
                <span className="block text-gray-500">Classic story (HTML)</span>
              </button>
              <button
                onClick={() => setUrl('https://raw.githubusercontent.com/adam-p/markdown-here/master/README.md')}
                className="px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 rounded transition-colors text-left"
              >
                <span className="font-medium">Markdown Guide</span>
                <span className="block text-gray-500">Complete syntax (MD)</span>
              </button>
              <button
                onClick={() => setUrl('https://jsonplaceholder.typicode.com/posts/1')}
                className="px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 rounded transition-colors text-left"
              >
                <span className="font-medium">JSON Example</span>
                <span className="block text-gray-500">API response (JSON)</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setUrl('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf')}
                className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 rounded transition-colors"
              >
                TraceMonkey Paper (PDF)
              </button>
              <button
                onClick={() => setUrl('https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/1_OneNum.csv')}
                className="px-3 py-1 text-xs bg-orange-50 hover:bg-orange-100 rounded transition-colors"
              >
                Sample CSV Data
              </button>
            </div>
            
            {/* CORS Notice */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-left">
              <p className="font-medium text-blue-800 mb-2">� Supported Formats</p>
              <p className="text-blue-700 mb-2">
                Booklet can read various document formats:
              </p>
              <ul className="mt-2 text-blue-700 text-xs list-disc list-inside space-y-1">
                <li><strong>Text:</strong> .txt, .md, .markdown files</li>
                <li><strong>Web:</strong> .html, .htm pages</li>
                <li><strong>Data:</strong> .json, .xml, .csv files</li>
                <li><strong>PDFs:</strong> .pdf documents (with CORS proxy if needed)</li>
                <li><strong>Stories & Articles:</strong> Any text-based content online</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recently Opened</h3>
            <div className="space-y-2">
              {recentDocuments.map((doc, index) => (
                <div
                  key={index}
                  onClick={() => handleRecentClick(doc.url)}
                  className="p-3 rounded hover:bg-gray-50 cursor-pointer border border-gray-100 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.title}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{doc.url}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(doc.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-3 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      {doc.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex justify-center space-x-6 flex-wrap">
            <span>📱 Mobile Friendly</span>
            <span>💾 Offline Caching</span>
            <span>🔍 Zoom Controls</span>
            <span>📝 Multiple Formats</span>
            <span>🎯 Easy Reading</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLInput;