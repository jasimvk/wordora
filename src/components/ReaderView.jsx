import { useState, useEffect, useRef } from 'react';
import { StarIcon, ArchiveBoxIcon, ArrowLeftIcon, BookmarkIcon, AdjustmentsHorizontalIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const ReaderView = ({ item, onClose, onUpdateProgress }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif' or 'sans'
  const [lineHeight, setLineHeight] = useState(1.7);
  const [margin, setMargin] = useState(8); // in rem
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [highlights, setHighlights] = useState([]); // Array of {id, text, position}
  const [bookmarks, setBookmarks] = useState([]); // Array of positions
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedResume, setDismissedResume] = useState(false);

  // Load persisted settings (theme, fontSize, fontFamily, lineHeight, margin)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('reader:theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }

      const savedFontSize = localStorage.getItem('reader:fontSize');
      if (savedFontSize) setFontSize(Number(savedFontSize));

      const savedFontFamily = localStorage.getItem('reader:fontFamily');
      if (savedFontFamily) setFontFamily(savedFontFamily);

      const savedLineHeight = localStorage.getItem('reader:lineHeight');
      if (savedLineHeight) setLineHeight(Number(savedLineHeight));

      const savedMargin = localStorage.getItem('reader:margin');
      if (savedMargin) setMargin(Number(savedMargin));
    } catch (e) {
      // ignore
    }
  }, []);

  // Ensure Tailwind dark mode class is set on the document root and persist theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('reader:theme', theme); } catch (e) {}
    return () => {};
  }, [theme]);

  // Persist other settings when they change
  useEffect(() => { try { localStorage.setItem('reader:fontSize', String(fontSize)); } catch (e) {} }, [fontSize]);
  useEffect(() => { try { localStorage.setItem('reader:fontFamily', fontFamily); } catch (e) {} }, [fontFamily]);
  useEffect(() => { try { localStorage.setItem('reader:lineHeight', String(lineHeight)); } catch (e) {} }, [lineHeight]);
  useEffect(() => { try { localStorage.setItem('reader:margin', String(margin)); } catch (e) {} }, [margin]);
  const [pdfDocument, setPdfDocument] = useState(null);
  
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);


  // On mount, restore last read position for articles and PDFs
  const shouldScrollToResume = useRef(false);
  useEffect(() => {
    if (item) {
      loadContent();
      setDismissedResume(false);
      // For articles, set flag to scroll after content loads
      if (item.type !== 'PDF' && item.readProgress > 0) {
        shouldScrollToResume.current = true;
      }
      // For PDFs, go to last read page
      if (item.type === 'PDF' && item.readProgress > 0 && totalPages > 0) {
        const page = Math.max(1, Math.round((item.readProgress / 100) * totalPages));
        setCurrentPage(page);
      }
    }
    // eslint-disable-next-line
  }, [item, totalPages]);

  // Scroll to resume position after loading for articles
  useEffect(() => {
    if (item?.type !== 'PDF' && shouldScrollToResume.current && !loading && contentRef.current) {
      setTimeout(() => {
        const el = contentRef.current;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        el.scrollTop = Math.round((item.readProgress / 100) * scrollHeight);
        shouldScrollToResume.current = false;
      }, 100);
    }
  }, [loading, item]);

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPDFPage();
    }
  }, [pdfDocument, currentPage, scale]);

  useEffect(() => {
    // Track scroll progress for articles
    if (item?.type !== 'PDF' && contentRef.current) {
      const handleScroll = () => {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          const element = contentRef.current;
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight - element.clientHeight;
          const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
          
          if (progress > item.readProgress) {
            onUpdateProgress(item.id, progress);
          }
        }, 500);
      };

      contentRef.current.addEventListener('scroll', handleScroll);
      return () => {
        if (contentRef.current) {
          contentRef.current.removeEventListener('scroll', handleScroll);
        }
        clearTimeout(scrollTimeoutRef.current);
      };
    }
  }, [item, onUpdateProgress]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (item.type === 'PDF') {
        await loadPDF();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      setError('Failed to load content. Please try again.');
      setLoading(false);
    }
  };

  const loadPDF = async () => {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: item.url
      });
      
      const pdfDoc = await loadingTask.promise;
      setPdfDocument(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      setCurrentPage(1);
    } catch (error) {
      // Try to load from cached content if URL fails
      if (item.content) {
        try {
          const blob = new Blob([item.content], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const loadingTask = pdfjsLib.getDocument(url);
          const pdfDoc = await loadingTask.promise;
          setPdfDocument(pdfDoc);
          setTotalPages(pdfDoc.numPages);
          setCurrentPage(1);
        } catch (blobError) {
          throw new Error('Failed to load PDF from both URL and cached content');
        }
      } else {
        throw error;
      }
    }
  };

  const renderPDFPage = async () => {
    if (!pdfDocument || !canvasRef.current) return;
    
    try {
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Update reading progress for PDFs
      const progress = Math.round((currentPage / totalPages) * 100);
      if (progress > item.readProgress) {
        onUpdateProgress(item.id, progress);
      }
      
    } catch (error) {
      console.error('Failed to render PDF page:', error);
      setError('Failed to render page');
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content, type) => {
    if (!content) return '';

    switch (type) {
      case 'Markdown':
        return content
          .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">$1</h1>')
          .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">$1</h2>')
          .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-3 text-gray-800 dark:text-gray-100">$1</h3>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
          .replace(/`(.*?)`/gim, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/\n/g, '<br>');
      
      case 'HTML':
        // Strip scripts and clean HTML
        const cleanContent = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
        
        // Extract main content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanContent;
        const article = tempDiv.querySelector('article') || 
                       tempDiv.querySelector('main') || 
                       tempDiv.querySelector('.content') ||
                       tempDiv.querySelector('#content') ||
                       tempDiv;
        
        return article.innerHTML;
      
      case 'JSON':
        try {
          const parsed = JSON.parse(content);
          return `<pre class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg overflow-auto text-sm"><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
        } catch {
          return `<pre class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg overflow-auto text-sm"><code>${content}</code></pre>`;
        }
      
      case 'CSV':
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return content;
        
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).filter(line => line.trim());
        
        return `
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-800">
                  ${headers.map(header => `<th class="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium">${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                    ${row.split(',').map(cell => `<td class="border border-gray-300 dark:border-gray-600 px-4 py-2">${cell.trim()}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      
      default:
        return content
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/\n/g, '<br>');
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleFontFamily = () => {
    setFontFamily(prev => prev === 'serif' ? 'sans' : 'serif');
  };

  const addHighlight = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      if (text) {
        const rect = range.getBoundingClientRect();
        const newHighlight = {
          id: Date.now(),
          text,
          position: { top: rect.top + window.scrollY, left: rect.left }
        };
        setHighlights(prev => [...prev, newHighlight]);
        selection.removeAllRanges();
      }
    }
  };

  const addBookmark = () => {
    if (contentRef.current) {
      const scrollTop = contentRef.current.scrollTop;
      setBookmarks(prev => [...prev, scrollTop]);
    }
  };

  const goToBookmark = (position) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = position;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault();
            addHighlight();
            break;
          case 'b':
            e.preventDefault();
            addBookmark();
            break;
          case 's':
            e.preventDefault();
            setShowSettings(prev => !prev);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Unable to Load Content</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={loadContent} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={onClose} 
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-2 sm:px-6 h-12 sm:h-14 shadow-lg transition-shadow">
        <button onClick={onClose} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 active:bg-gray-100 dark:active:bg-gray-800 transition-all px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400" title="Back">
          <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-1" />
          <span className="hidden sm:inline font-medium">Back</span>
        </button>
        <div className="flex-1 flex flex-col items-center max-w-xs sm:max-w-sm">
          <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate w-full text-center">{item.title}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{item.type}</div>
        </div>
        <button onClick={toggleTheme} className="p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-800 transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          <span className="sr-only">Toggle theme</span>
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Thin reading progress bar at top */}
      <div className="fixed top-14 left-0 right-0 z-20 h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-1 bg-blue-600 dark:bg-blue-400 transition-all duration-500"
          style={{ width: `${item.readProgress || 0}%`, transitionProperty: 'width' }}
        />
      </div>
      {/* Last read position marker for articles */}
      {item.type !== 'PDF' && item.readProgress > 0 && !dismissedResume && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 z-30 bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-medium shadow-lg flex flex-col sm:flex-row items-center gap-1 sm:gap-3" role="status">
          <span className="text-center">You stopped here ({Math.round(item.readProgress)}%)</span>
          <div className="flex gap-1 sm:gap-2">
            <button
              className="bg-white text-blue-600 px-1 sm:px-2 py-1 rounded font-semibold text-xs hover:bg-blue-50 transition-colors"
              onClick={() => {
                // Resume: scroll to last position after content is loaded
                shouldScrollToResume.current = true;
                if (!loading && contentRef.current) {
                  setTimeout(() => {
                    const el = contentRef.current;
                    const scrollHeight = el.scrollHeight - el.clientHeight;
                    el.scrollTop = Math.round((item.readProgress / 100) * scrollHeight);
                    shouldScrollToResume.current = false;
                  }, 100);
                }
              }}
            >Resume</button>
            <button
              className="bg-white text-blue-600 px-1 sm:px-2 py-1 rounded font-semibold text-xs hover:bg-blue-50 transition-colors"
              onClick={() => {
                // Start Over: reset progress and scroll to top
                if (contentRef.current) {
                  contentRef.current.scrollTop = 0;
                }
                onUpdateProgress(item.id, 0);
              }}
            >Start Over</button>
            <button
              className="ml-2 text-white/90 text-xs"
              onClick={() => setDismissedResume(true)}
            >Dismiss</button>
          </div>
        </div>
      )}
      {/* Last read position marker for PDFs */}
      {item.type === 'PDF' && item.readProgress > 0 && !dismissedResume && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 z-30 bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs font-medium shadow-lg flex flex-col sm:flex-row items-center gap-1 sm:gap-3" role="status">
          <span className="text-center">You stopped at page {Math.max(1, Math.round((item.readProgress / 100) * totalPages))} / {totalPages}</span>
          <div className="flex gap-1 sm:gap-2">
            <button
              className="bg-white text-blue-600 px-1 sm:px-2 py-1 rounded font-semibold text-xs hover:bg-blue-50 transition-colors"
              onClick={() => {
                // Resume: jump to last page
                const page = Math.max(1, Math.round((item.readProgress / 100) * totalPages));
                setCurrentPage(page);
              }}
            >Resume</button>
            <button
              className="ml-1 bg-white text-blue-600 px-1 sm:px-2 py-1 rounded font-semibold text-xs hover:bg-blue-50 transition-colors"
              onClick={() => {
                // Start Over: go to page 1 and reset progress
                setCurrentPage(1);
                onUpdateProgress(item.id, 0);
              }}
            >Start Over</button>
            <button
              className="ml-2 text-white/90 text-xs"
              onClick={() => setDismissedResume(true)}
            >Dismiss</button>
          </div>
        </div>
      )}

      {/* Main content area */}
  <div className="flex-1 overflow-auto pt-20 sm:pt-16 pb-24 sm:pb-8 bg-gray-50 dark:bg-gray-900" ref={contentRef}>
        {item.type === 'PDF' ? (
          <div className="flex justify-center p-2 sm:p-6">
            <canvas 
              ref={canvasRef} 
              className="bg-white rounded-lg shadow-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
            />
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto px-3 sm:px-8 py-4 sm:py-10">
            {/* Article Header - NYT Style */}
            <header className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight text-gray-900 dark:text-white" style={{ fontFamily: fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : 'Inter, system-ui, sans-serif' }}>
                {item.title}
              </h1>
              {item.byline && (
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-2" style={{ fontFamily: fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : 'Inter, system-ui, sans-serif' }}>
                  By {item.byline}
                </p>
              )}
              {item.date && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(item.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </header>
            <article 
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-10 leading-relaxed text-gray-900 dark:text-gray-100 prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert border border-gray-100 dark:border-gray-800 transition-shadow"
              style={{ 
                fontSize: `min(max(${fontSize}px, 16px), 26px)`, 
                lineHeight: lineHeight,
                margin: `${margin / 2}rem ${margin}rem`,
                fontFamily: fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : 'Inter, system-ui, sans-serif'
              }}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(item.content, item.type)
              }}
              onMouseUp={addHighlight}
              onTouchEnd={addHighlight} // For mobile touch selection
            />
            {/* Highlights */}
            {highlights.map(highlight => (
              <div 
                key={highlight.id} 
                className="absolute bg-yellow-200 dark:bg-yellow-600 px-1 py-0.5 rounded text-xs z-10"
                style={{ top: highlight.position.top, left: highlight.position.left }}
              >
                {highlight.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">Reading Settings</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">Font Size: {fontSize}px</label>
                <input 
                  type="range" 
                  min="14" 
                  max="28" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">Line Height: {lineHeight}</label>
                <input 
                  type="range" 
                  min="1.4" 
                  max="2.0" 
                  step="0.1" 
                  value={lineHeight} 
                  onChange={(e) => setLineHeight(Number(e.target.value))} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">Margin: {margin}rem</label>
                <input 
                  type="range" 
                  min="2" 
                  max="12" 
                  value={margin} 
                  onChange={(e) => setMargin(Number(e.target.value))} 
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Font Family</span>
                <button 
                  onClick={toggleFontFamily} 
                  className="px-2 sm:px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                >
                  {fontFamily === 'serif' ? 'Serif' : 'Sans'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <button 
                  onClick={toggleTheme} 
                  className="px-2 sm:px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                >
                  {theme === 'light' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)} 
              className="mt-4 sm:mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

  {/* Floating favorite/archive actions and font size controls (hidden on small screens) */}
  <div className="hidden sm:flex fixed bottom-4 sm:bottom-5 right-3 sm:right-4 z-30 flex-col gap-2 sm:gap-3 items-end">
        <button 
          onClick={addHighlight} 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full p-2 sm:p-3 hover:bg-yellow-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-yellow-400" 
          title="Highlight (Ctrl+H)"
        >
          <span className="text-yellow-500 font-bold text-xs sm:text-sm">H</span>
        </button>
        <button 
          onClick={addBookmark} 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full p-2 sm:p-3 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-400" 
          title="Bookmark (Ctrl+B)"
        >
          <BookmarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={() => setShowSettings(true)} 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-gray-400" 
          title="Settings (Ctrl+S)"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:scale-110 transition-transform" />
        </button>
        {/* Floating font size controls */}
        <div className="flex flex-col gap-1 sm:gap-2 mt-1 sm:mt-2 bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 shadow-xl rounded-full p-1 sm:p-2 items-center">
          <button 
            onClick={() => setFontSize(prev => Math.min(prev + 2, 28))}
            className="p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-800 transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Increase Font Size"
            aria-label="Increase font size"
          >
            <span className="text-xs sm:text-sm font-bold">A+</span>
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[1.5rem] sm:min-w-[2rem] text-center select-none">
            {fontSize}px
          </span>
          <button 
            onClick={() => setFontSize(prev => Math.max(prev - 2, 14))}
            className="p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-gray-800 transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Decrease Font Size"
            aria-label="Decrease font size"
          >
            <span className="text-xs sm:text-sm font-bold">A-</span>
          </button>
        </div>
      </div>
      {/* Compact mobile bottom action bar */}
  <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 pb-4 safe-bottom flex items-center justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <button
          onClick={() => {
            // Resume for articles
            if (item.type !== 'PDF' && item.readProgress > 0) {
              shouldScrollToResume.current = true;
              if (!loading && contentRef.current) {
                const el = contentRef.current;
                const scrollHeight = el.scrollHeight - el.clientHeight;
                el.scrollTop = Math.round((item.readProgress / 100) * scrollHeight);
                shouldScrollToResume.current = false;
              }
            }
            // For PDFs jump to last page
            if (item.type === 'PDF' && item.readProgress > 0 && totalPages > 0) {
              const page = Math.max(1, Math.round((item.readProgress / 100) * totalPages));
              setCurrentPage(page);
            }
          }}
          className="flex flex-col items-center text-xs text-gray-700 dark:text-gray-300"
        >
          <span className="text-sm font-medium">⤴︎</span>
          <span>Resume</span>
        </button>
        <button onClick={addBookmark} className="flex flex-col items-center text-xs text-gray-700 dark:text-gray-300">
          <BookmarkIcon className="w-5 h-5 text-blue-500" />
          <span>Bookmark</span>
        </button>
        <button onClick={() => setShowSettings(true)} className="flex flex-col items-center text-xs text-gray-700 dark:text-gray-300">
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <div className="flex flex-col items-center text-xs text-gray-700 dark:text-gray-300">
          <button onClick={() => setFontSize(prev => Math.max(prev - 2, 14))} className="text-sm">A-</button>
          <button onClick={() => setFontSize(prev => Math.min(prev + 2, 28))} className="text-sm">A+</button>
        </div>
      </div>
    </div>
  );
};

export default ReaderView;