import { useState, useEffect, useRef } from 'react';
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
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [pdfDocument, setPdfDocument] = useState(null);
  
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (item) {
      loadContent();
    }
  }, [item]);

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
      {/* Header with controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-lg">{item.type === 'PDF' ? '📄' : '📰'}</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {item.type === 'PDF' ? (
            <>
              {/* PDF Controls */}
              <button 
                onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Zoom Out"
              >
                🔍-
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Zoom In"
              >
                🔍+
              </button>
              
              {totalPages > 1 && (
                <>
                  <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-4"></div>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors"
                  >
                    →
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Text Controls */}
              <button 
                onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {fontSize}px
              </span>
              <button 
                onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Increase Font Size"
              >
                A+
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900" ref={contentRef}>
        {item.type === 'PDF' ? (
          <div className="flex justify-center p-4">
            <canvas 
              ref={canvasRef} 
              className="shadow-lg bg-white max-w-full h-auto"
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <article 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 leading-relaxed text-gray-900 dark:text-gray-100"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ 
                __html: `<div class="prose prose-lg max-w-none dark:prose-invert">${formatContent(item.content, item.type)}</div>` 
              }}
            />
          </div>
        )}
      </div>

      {/* Reading progress indicator */}
      {item.readProgress > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg">
          {Math.round(item.readProgress)}% read
        </div>
      )}
    </div>
  );
};

export default ReaderView;