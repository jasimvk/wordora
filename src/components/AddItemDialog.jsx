import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Readability } from '@mozilla/readability';

const AddItemDialog = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useManualContent, setUseManualContent] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setUrl('');
    setError('');
    setLoading(false);
    setUseManualContent(false);
    setManualContent('');
    setTags('');
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
    let cleanContent = content;

    try {
      if (type === 'Article' || type === 'HTML') {
        // Create a new document for Readability parsing
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Clone the document for Readability (required for proper parsing)
        const docClone = doc.cloneNode(true);
        
        // Use Mozilla Readability to extract clean article content
        const article = new Readability(docClone, {
          charThreshold: 500,
          classesToPreserve: [],
          keepClasses: false
        }).parse();

        if (article) {
          console.log('✅ Readability successfully parsed article:', article.title);
          title = article.title || title;
          excerpt = article.excerpt || '';
          
          // Clean the content and remove unwanted elements
          cleanContent = DOMPurify.sanitize(article.content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
            REMOVE_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            REMOVE_ATTR: ['style', 'class', 'id', 'data-*']
          });
          
          console.log('🧹 Content cleaned by DOMPurify, length:', cleanContent.length);
          
          // Calculate reading time from clean text
          const textContent = article.textContent || '';
          const words = textContent.split(/\s+/).length;
          readingTime = Math.max(1, Math.ceil(words / 200));
        } else {
          console.log('⚠️ Readability failed, using fallback HTML parsing');
          // Fallback to basic HTML parsing if Readability fails
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
          
          // Clean the basic HTML content
          cleanContent = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
            REMOVE_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            REMOVE_ATTR: ['style', 'class', 'id']
          });
          
          // Calculate reading time
          const textContent = tempDiv.textContent || '';
          const words = textContent.split(/\s+/).length;
          readingTime = Math.max(1, Math.ceil(words / 200));
        }
        
        // Extract thumbnail from meta tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const metaImg = tempDiv.querySelector('meta[property="og:image"]') ||
                       tempDiv.querySelector('meta[name="twitter:image"]');
        if (metaImg) {
          thumbnail = metaImg.getAttribute('content');
        }
        
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
      readingTime: readingTime ? `${readingTime} min read` : null,
      content: cleanContent // Return the cleaned content
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
      // Validate and clean URL
      const cleanUrl = url.trim();
      let validUrl;
      
      try {
        // Try to create a URL object to validate the URL
        validUrl = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
        console.log('Processing URL:', validUrl.href);
      } catch (urlError) {
        throw new Error('Please enter a valid URL');
      }

      const type = detectContentType(validUrl.href);
      let content = '';
      let metadata = {};

      if (useManualContent && manualContent.trim()) {
        // Use manually entered content
        content = manualContent.trim();
        metadata = await extractMetadata(validUrl.href, content, type);
      } else {
        // Fetch content
        try {
          const response = await fetch(validUrl.href);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }
          content = await response.text();
        } catch (fetchError) {
          console.log('Direct fetch failed:', fetchError.message);
          
          // If direct fetch fails due to CORS, try with multiple proxy services
          let contentFetched = false;
          const proxyServices = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(validUrl.href)}`,
            `https://cors-anywhere.herokuapp.com/${encodeURIComponent(validUrl.href)}`,
            `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(validUrl.href)}`
          ];

          for (let i = 0; i < proxyServices.length; i++) {
            const proxyUrl = proxyServices[i];
            try {
              console.log(`Trying proxy ${i + 1}:`, proxyUrl);
              const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });
              
              if (response.ok) {
                content = await response.text();
                console.log('Proxy fetch successful');
                contentFetched = true;
                break;
              } else {
                console.log(`Proxy ${i + 1} failed with status:`, response.status);
              }
            } catch (proxyError) {
              console.log(`Proxy ${i + 1} error:`, proxyError.message);
              // Try next proxy
              continue;
            }
          }

          if (!contentFetched) {
            console.log('All proxy attempts failed, showing manual content option');
            // Show manual content option
            setUseManualContent(true);
            throw new Error('Unable to access this URL due to CORS restrictions. You can paste the content manually below.');
          }
        }

        // Extract metadata
        metadata = await extractMetadata(validUrl.href, content, type);
      }      // Create item object
      const parsedTags = tags.trim() 
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];
        
      const item = {
        id: Date.now().toString(),
        url: validUrl.href,
        type: type,
        title: metadata.title,
        excerpt: metadata.excerpt,
        thumbnail: metadata.thumbnail,
        readingTime: metadata.readingTime,
        content: metadata.content || content, // Use cleaned content if available
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-light text-gray-900">Add article</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a link here"
              className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400 font-light text-lg"
              disabled={loading}
              autoFocus
            />
            
            {/* Manual content option */}
            <div className="mt-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualContent}
                  onChange={(e) => setUseManualContent(e.target.checked)}
                  className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <span className="font-light">Add content manually</span>
              </label>
              
              {useManualContent && (
                <div className="mt-3">
                  <textarea
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Enter your content here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-gray-400 font-light text-sm resize-none"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
            
            {/* Tags input */}
            <div className="mt-4">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full px-4 py-2 border border-gray-200 focus:outline-none focus:border-gray-400 font-light text-sm"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 font-light">
                Add tags separated by commas (e.g., tech, article, important)
              </p>
            </div>
            
            {error && (
              <p className="mt-3 text-sm text-red-600 font-light">{error}</p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors font-light"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || (!url.trim() || (useManualContent && !manualContent.trim()))}
              className="flex-1 bg-gray-800 text-white py-3 px-6 font-light hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemDialog;