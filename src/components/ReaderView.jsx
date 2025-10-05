import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

const ReaderView = ({ item, onClose, onUpdateProgress, userId = null }) => {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [theme, setTheme] = useState('sepia');
  const [showSettings, setShowSettings] = useState(false);
  const contentRef = useRef(null);

  // Load persisted settings
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('clipit:theme') || 'sepia';
      const savedFontSize = localStorage.getItem('clipit:fontSize') || '18';
      const savedFontFamily = localStorage.getItem('clipit:fontFamily') || 'Georgia';
      const savedLineHeight = localStorage.getItem('clipit:lineHeight') || '1.6';
      
      setTheme(savedTheme);
      setFontSize(Number(savedFontSize));
      setFontFamily(savedFontFamily);
      setLineHeight(Number(savedLineHeight));
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist settings when they change
  useEffect(() => {
    try {
      localStorage.setItem('clipit:theme', theme);
      localStorage.setItem('clipit:fontSize', String(fontSize));
      localStorage.setItem('clipit:fontFamily', fontFamily);
      localStorage.setItem('clipit:lineHeight', String(lineHeight));
    } catch (e) {
      // ignore
    }
  }, [theme, fontSize, fontFamily, lineHeight]);

  // Track reading progress
  useEffect(() => {
    if (contentRef.current) {
      const handleScroll = () => {
        const element = contentRef.current;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        
        if (progress > (item.readProgress || 0)) {
          onUpdateProgress(item.id, progress);
        }
      };

      contentRef.current.addEventListener('scroll', handleScroll);
      return () => {
        if (contentRef.current) {
          contentRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [item, onUpdateProgress]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'light':
        return 'bg-white text-gray-900';
      case 'sepia':
      default:
        return 'bg-yellow-50 text-gray-800';
    }
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (hasHtmlTags) {
      // Sanitize HTML content to ensure it's safe and clean
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
        REMOVE_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        REMOVE_ATTR: ['style', 'class', 'id', 'onclick', 'onload', 'onerror']
      });
    } else {
      // Simple text content formatting
      return content
        .replace(/\n\n/g, '</p><p class="mb-6">')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p class="mb-6">')
        .replace(/$/, '</p>');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${getThemeClasses()}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 ${getThemeClasses()} border-b border-opacity-20 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-light transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Done</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-600 hover:text-gray-900 font-light transition-colors"
            >
              Text Settings
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-16 right-6 z-20 bg-white border border-gray-200 shadow-lg p-6 rounded-lg min-w-[300px]">
          <h3 className="text-lg font-light mb-4 text-gray-900">Text Settings</h3>
          
          <div className="space-y-4">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Font Size</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setFontSize(Math.max(fontSize - 2, 12))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <span className="text-lg">-</span>
                </button>
                <span className="text-sm text-gray-600 w-12 text-center">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(fontSize + 2, 32))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded text-gray-900 font-light"
              >
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times</option>
                <option value="Palatino">Palatino</option>
                <option value="system-ui">San Francisco</option>
                <option value="Helvetica">Helvetica</option>
              </select>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Line Spacing</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setLineHeight(Math.max(lineHeight - 0.1, 1.2))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <span className="text-lg">-</span>
                </button>
                <span className="text-sm text-gray-600 w-12 text-center">{lineHeight.toFixed(1)}</span>
                <button
                  onClick={() => setLineHeight(Math.min(lineHeight + 0.1, 2.0))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-light text-gray-700 mb-2">Background</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded border-2 ${theme === 'light' ? 'border-gray-800' : 'border-gray-200'} bg-white text-gray-900 text-sm`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`p-3 rounded border-2 ${theme === 'sepia' ? 'border-gray-800' : 'border-gray-200'} bg-yellow-50 text-gray-800 text-sm`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded border-2 ${theme === 'dark' ? 'border-gray-400' : 'border-gray-200'} bg-gray-900 text-gray-100 text-sm`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <main 
        ref={contentRef}
        className="overflow-y-auto h-full pb-32"
        style={{ paddingTop: '0' }}
      >
        <article className="max-w-2xl mx-auto px-6 py-12">
          {/* Article Header */}
          <header className="mb-12">
            <h1 
              className="text-4xl font-light leading-tight mb-6"
              style={{ 
                fontFamily: fontFamily === 'system-ui' ? 'system-ui, -apple-system, sans-serif' : fontFamily,
              }}
            >
              {item.title}
            </h1>
            
            {item.byline && (
              <p className="text-lg font-light text-gray-600 mb-2">
                By {item.byline}
              </p>
            )}
            
            {item.url && (
              <p className="text-sm font-light text-gray-500 mb-4">
                {new URL(item.url).hostname}
              </p>
            )}
            
            {item.date && (
              <time className="text-sm font-light text-gray-500">
                {new Date(item.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
            )}
          </header>

          {/* Article Body */}
          <div
            className="prose prose-lg max-w-none article-content"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              fontFamily: fontFamily === 'system-ui' ? 'system-ui, -apple-system, sans-serif' : fontFamily,
              color: theme === 'dark' ? '#e5e7eb' : theme === 'sepia' ? '#1f2937' : '#111827',
              // CSS isolation to prevent external styles from interfering
              all: 'unset',
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
            dangerouslySetInnerHTML={{
              __html: formatContent(item.content || item.excerpt || 'No content available.')
            }}
          />
        </article>
      </main>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 bg-opacity-50">
        <div
          className="h-1 bg-gray-800 transition-all duration-300"
          style={{ width: `${item.readProgress || 0}%` }}
        />
      </div>
    </div>
  );
};

export default ReaderView;