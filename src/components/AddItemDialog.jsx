import { useState } from 'react';

const AddItemDialog = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setUrl('');
    setTags('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const detectContentType = (url) => {
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
      'csv': 'CSV'
    };
    return typeMap[extension] || 'Article';
  };

  const extractMetadata = async (url, content, type) => {
    let title = 'Untitled Document';
    let excerpt = '';
    let thumbnail = null;
    let readingTime = null;

    try {
      if (type === 'Article' || type === 'HTML') {
        // For HTML content, try to parse with simple DOM parsing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Extract title
        const titleElement = tempDiv.querySelector('title') || 
                            tempDiv.querySelector('h1') || 
                            tempDiv.querySelector('h2');
        if (titleElement) {
          title = titleElement.textContent.trim();
        }
        
        // Extract excerpt from meta description or first paragraph
        const metaDesc = tempDiv.querySelector('meta[name="description"]');
        if (metaDesc) {
          excerpt = metaDesc.getAttribute('content');
        } else {
          const firstP = tempDiv.querySelector('p');
          if (firstP) {
            excerpt = firstP.textContent.trim().substring(0, 200) + '...';
          }
        }
        
        // Extract thumbnail from meta image or first img
        const metaImg = tempDiv.querySelector('meta[property="og:image"]') ||
                       tempDiv.querySelector('meta[name="twitter:image"]');
        if (metaImg) {
          thumbnail = metaImg.getAttribute('content');
        } else {
          const firstImg = tempDiv.querySelector('img');
          if (firstImg) {
            thumbnail = firstImg.src;
          }
        }
        
        // Calculate reading time
        const textContent = tempDiv.textContent || '';
        const words = textContent.split(/\s+/).length;
        readingTime = Math.max(1, Math.ceil(words / 200));
      } else {
        // For other types, extract title from URL
        const filename = url.split('/').pop().split('?')[0];
        title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Document';
        
        if (type === 'JSON') {
          try {
            const jsonData = JSON.parse(content);
            if (jsonData.title) title = jsonData.title;
            excerpt = `JSON data with ${Object.keys(jsonData).length} properties`;
          } catch (e) {
            excerpt = 'JSON document';
          }
        } else if (type === 'Markdown') {
          const lines = content.split('\n').filter(line => line.trim());
          const titleLine = lines.find(line => line.startsWith('# '));
          if (titleLine) {
            title = titleLine.replace('# ', '').trim();
          }
          excerpt = lines.slice(0, 3).join(' ').substring(0, 200) + '...';
        } else if (type === 'Text') {
          const lines = content.split('\n').filter(line => line.trim());
          excerpt = lines.slice(0, 3).join(' ').substring(0, 200) + '...';
          const words = content.split(/\s+/).length;
          readingTime = Math.max(1, Math.ceil(words / 200));
        }
      }
    } catch (e) {
      console.warn('Failed to extract metadata:', e);
    }

    return {
      title: title || 'Untitled Document',
      excerpt: excerpt || '',
      thumbnail: thumbnail,
      readingTime: readingTime ? `${readingTime} min read` : null
    };
  };

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const type = detectContentType(url);
      let content = '';
      let metadata = {};

      // Fetch content
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        content = await response.text();
      } catch (fetchError) {
        // If direct fetch fails due to CORS, try with proxy
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Proxy fetch failed: ${response.status}`);
          }
          content = await response.text();
        } catch (proxyError) {
          throw new Error('Unable to access this URL due to CORS restrictions. Try a different URL or ensure the site allows cross-origin requests.');
        }
      }

      // Extract metadata
      metadata = await extractMetadata(url, content, type);

      // Create item object
      const parsedTags = tags.trim() 
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];
        
      const item = {
        id: Date.now().toString(),
        url: url.trim(),
        type: type,
        title: metadata.title,
        excerpt: metadata.excerpt,
        thumbnail: metadata.thumbnail,
        readingTime: metadata.readingTime,
        content: content,
        dateAdded: new Date().toISOString(),
        isFavorite: false,
        readProgress: 0,
        tags: parsedTags,
        isArchived: false
      };

      // Save item
      await onSave(item);
      
      // Reset and close
      resetForm();
      onClose();

    } catch (error) {
      console.error('Error saving item:', error);
      setError(error.message || 'Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickSaveOptions = [
    {
      title: "The New York Times",
      url: "https://www.nytimes.com/2024/01/01/technology/ai-2024-predictions.html",
      description: "AI predictions article"
    },
    {
      title: "Mozilla PDF.js Demo",
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      description: "Technical PDF document"
    },
    {
      title: "Markdown Guide",
      url: "https://raw.githubusercontent.com/adam-p/markdown-here/master/README.md",
      description: "Markdown syntax reference"
    },
    {
      title: "Sample JSON API",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      description: "JSON API response"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 font-graphik">Add to Booklet</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* URL Input */}
          <div className="mb-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a link"
              className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Tags Input */}
          <div className="mb-4">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags (comma separated)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">Separate tags with commas (e.g., tech, article, later)</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || !url.trim()}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-graphik"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemDialog;