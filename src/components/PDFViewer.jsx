import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const PDFViewer = ({ pdfUrl, onClose }) => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage();
    }
  }, [pdf, currentPage, scale]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load PDF with CORS handling
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: {
          'Access-Control-Allow-Origin': '*'
        },
        withCredentials: false
      });
      
      const pdfDocument = await loadingTask.promise;
      
      setPdf(pdfDocument);
      setTotalPages(pdfDocument.numPages);
      setCurrentPage(1);
      
      // Cache PDF for offline use
      if ('caches' in window) {
        try {
          const cache = await caches.open('pdf-cache-v1');
          await cache.add(pdfUrl);
        } catch (cacheErr) {
          console.warn('Could not cache PDF:', cacheErr);
        }
      }
      
    } catch (err) {
      let errorMessage = 'Failed to load PDF';
      
      if (err.message.includes('CORS') || err.message.includes('Access-Control-Allow-Origin')) {
        errorMessage = 'CORS Error: This PDF cannot be loaded due to security restrictions. Try using a direct PDF link or a PDF hosted on a CORS-enabled server.';
      } else if (err.message.includes('InvalidPDFException')) {
        errorMessage = 'Invalid PDF: The provided URL does not point to a valid PDF file.';
      } else if (err.message.includes('MissingPDFException')) {
        errorMessage = 'PDF Not Found: The PDF could not be found at the provided URL.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('PDF loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return;
    
    try {
      const page = await pdf.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Page rendering error:', err);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  if (loading) {
    return (
      <div className="pdf-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-container flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={loadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* PDF Controls */}
      <div className="reader-controls max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="control-btn"
            title="Previous page"
          >
            ← Previous
          </button>
          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="control-btn"
            title="Next page"
          >
            Next →
          </button>
        </div>

        <div className="zoom-controls">
          <button onClick={zoomOut} className="zoom-btn" title="Zoom out">
            Zoom Out
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="zoom-btn" title="Zoom in">
            Zoom In
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="pdf-viewer bg-gray-100 py-8">
        <div className="pdf-page">
          <canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl" />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;