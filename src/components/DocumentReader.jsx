import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const DocumentReader = ({ documentUrl, onClose }) => {
  const [content, setContent] = useState(null);
  const [documentType, setDocumentType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [fontSize, setFontSize] = useState(16);
  const canvasRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (documentUrl) {
      loadDocument();
    }
  }, [documentUrl]);

  useEffect(() => {
    if (content && documentType === 'pdf' && currentPage) {
      renderPDFPage();
    }
  }, [content, currentPage, scale, documentType]);

  const detectDocumentType = (url) => {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    const mimeTypeMap = {
      'pdf': 'pdf',
      'txt': 'text',
      'md': 'markdown',
      'markdown': 'markdown',
      'html': 'html',
      'htm': 'html',
      'json': 'json',
      'xml': 'xml',
      'csv': 'csv',
      'rtf': 'text',
      'doc': 'text',
      'docx': 'text'
    };
    return mimeTypeMap[extension] || 'text';
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const type = detectDocumentType(documentUrl);
      setDocumentType(type);

      if (type === 'pdf') {
        await loadPDF();
      } else {
        await loadTextDocument();
      }
      
    } catch (error) {
      console.error('Failed to load document:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadPDF = async () => {
    const loadingTask = pdfjsLib.getDocument({
      url: documentUrl,
      httpHeaders: {
        'Access-Control-Allow-Origin': '*'
      },
      withCredentials: false
    });
    
    const pdfDocument = await loadingTask.promise;
    
    setContent(pdfDocument);
    setTotalPages(pdfDocument.numPages);
    setCurrentPage(1);
    
    // Cache PDF for offline use
    if ('caches' in window) {
      try {
        const cache = await caches.open('wordora-pdfs-v1');
        await cache.add(documentUrl);
      } catch (cacheError) {
        console.warn('Failed to cache PDF:', cacheError);
      }
    }
  };

  const loadTextDocument = async () => {
    const response = await fetch(documentUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    setContent(text);
    setTotalPages(1);
    setCurrentPage(1);
    
    // Cache text document for offline use
    if ('caches' in window) {
      try {
        const cache = await caches.open('wordora-documents-v1');
        await cache.add(documentUrl);
      } catch (cacheError) {
        console.warn('Failed to cache document:', cacheError);
      }
    }
  };

  const renderPDFPage = async () => {
    if (!content || !canvasRef.current) return;
    
    try {
      const page = await content.getPage(currentPage);
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
    } catch (error) {
      console.error('Failed to render PDF page:', error);
      setError('Failed to render page');
    }
  };

  const formatTextContent = (text, type) => {
    switch (type) {
      case 'markdown':
        // Basic markdown formatting
        return text
          .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
          .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 text-gray-900">$1</h2>')
          .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 text-gray-900">$1</h3>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/\n/g, '<br>');
      
      case 'html':
        return text;
      
      case 'json':
        try {
          const parsed = JSON.parse(text);
          return `<pre class="bg-gray-100 p-4 rounded overflow-auto"><code>${JSON.stringify(parsed, null, 2)}</code></pre>`;
        } catch {
          return `<pre class="bg-gray-100 p-4 rounded overflow-auto"><code>${text}</code></pre>`;
        }
      
      case 'csv':
        const lines = text.split('\n');
        const headers = lines[0]?.split(',') || [];
        const rows = lines.slice(1).filter(line => line.trim());
        
        return `
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  ${headers.map(header => `<th class="border border-gray-300 px-4 py-2 text-left">${header.trim()}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    ${row.split(',').map(cell => `<td class="border border-gray-300 px-4 py-2">${cell.trim()}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      
      default:
        // Plain text with paragraph breaks
        return text
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/\n/g, '<br>');
    }
  };

  const getErrorMessage = (error) => {
    if (error.message.includes('CORS')) {
      return 'Unable to load document due to CORS restrictions. Try enabling the CORS proxy or use a different URL.';
    }
    if (error.message.includes('404')) {
      return 'Document not found. Please check the URL and try again.';
    }
    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return error.message || 'An error occurred while loading the document.';
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Unable to Load Document</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => loadDocument()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={onClose} 
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header with controls */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
          <div className="text-sm text-gray-500 capitalize">
            {documentType} Document
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {documentType === 'pdf' ? (
            <>
              {/* PDF Controls */}
              <button 
                onClick={zoomOut}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Zoom Out"
              >
                🔍-
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={zoomIn}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Zoom In"
              >
                🔍+
              </button>
              
              {totalPages > 1 && (
                <>
                  <div className="border-l border-gray-300 h-6 mx-4"></div>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600 min-w-[4rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 transition-colors"
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
                onClick={decreaseFontSize}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {fontSize}px
              </span>
              <button 
                onClick={increaseFontSize}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Increase Font Size"
              >
                A+
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {documentType === 'pdf' ? (
          <div className="flex justify-center p-4">
            <canvas 
              ref={canvasRef} 
              className="shadow-lg bg-white max-w-full h-auto"
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <div 
              ref={textRef}
              className="bg-white rounded-lg shadow-sm p-8 leading-relaxed text-gray-900"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ 
                __html: `<p class="mb-4">${formatTextContent(content, documentType)}</p>` 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentReader;