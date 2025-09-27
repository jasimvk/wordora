import { useState, useEffect } from 'react';
import SavedItemsList from './components/SavedItemsList';
import AddItemDialog from './components/AddItemDialog';
import ReaderView from './components/ReaderView';
import LandingPage from './components/LandingPage';
import { StorageManager } from './utils/storage';

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

function App() {
  const [savedItems, setSavedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('mylist'); // 'mylist', 'favorites', 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Filter items based on current view and search query
  const filteredItems = savedItems.filter(item => {
    // Filter by view
    let viewMatch = true;
    if (currentView === 'favorites') {
      viewMatch = item.isFavorite === true;
    } else if (currentView === 'archive') {
      viewMatch = item.isArchived === true;
    } else if (currentView === 'mylist') {
      viewMatch = item.isArchived !== true; // Show non-archived items
    }

    // Filter by search query
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = 
        item.title.toLowerCase().includes(query) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)));
    }

    return viewMatch && searchMatch;
  });

  useEffect(() => {
    // Load saved items on app start
    loadSavedItems();
  }, []);

  const loadSavedItems = () => {
    try {
      let items = StorageManager.getAllItems();
      setSavedItems(items);
    } catch (error) {
      console.error('Failed to load saved items:', error);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = () => {
    const sampleArticles = [
      {
        id: Date.now().toString() + '1',
        url: 'https://techcrunch.com/future-of-ai',
        type: 'Article',
        title: 'The Future of AI: Breakthrough Technologies Reshaping 2025',
        excerpt: 'Exploring the latest developments in AI technology and what they mean for our daily lives. From machine learning breakthroughs to ethical considerations in artificial intelligence.',
        content: 'The Future of AI: Breakthrough Technologies Reshaping 2025\n\nArtificial Intelligence continues to evolve at an unprecedented pace, with new developments emerging daily that promise to transform how we work, learn, and interact with technology...',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
        readingTime: '8 min read',
        dateAdded: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isFavorite: true,
        isArchived: false,
        readProgress: 65,
        tags: ['technology', 'ai', 'future', 'innovation']
      },
      {
        id: Date.now().toString() + '2',
        url: 'https://medium.com/productivity-hacks',
        type: 'Article',
        title: '10 Productivity Tips That Actually Work (Backed by Science)',
        excerpt: 'Science-backed productivity techniques that can help you get more done without burning out. Includes time management strategies, focus techniques, and work-life balance tips.',
        content: '10 Productivity Tips That Actually Work\n\nProductivity is not about doing more things, it\'s about doing the right things efficiently...',
        thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=250&fit=crop',
        readingTime: '5 min read',
        dateAdded: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        isFavorite: true,
        isArchived: false,
        readProgress: 100,
        tags: ['productivity', 'tips', 'work', 'lifestyle']
      },
      {
        id: Date.now().toString() + '3',
        url: 'https://example.com/climate-report.pdf',
        type: 'PDF',
        title: 'Global Climate Change Report 2025: Environmental Impact Analysis',
        excerpt: 'Comprehensive analysis of global climate trends and their impact on various ecosystems worldwide. Includes data from 195 countries and projections for the next decade.',
        content: 'Climate Change Report 2025\n\nExecutive Summary\n\nThis report presents a comprehensive analysis of global climate patterns...',
        thumbnail: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e5?w=400&h=250&fit=crop',
        readingTime: '15 min read',
        dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isFavorite: false,
        isArchived: true,
        readProgress: 0,
        tags: ['climate', 'environment', 'report', 'science']
      },
      {
        id: Date.now().toString() + '4',
        url: 'https://www.nytimes.com/remote-work-trends',
        type: 'Article',
        title: 'Remote Work Revolution: How Companies Are Adapting in 2025',
        excerpt: 'An in-depth look at how the remote work landscape has evolved, featuring insights from Fortune 500 companies and emerging workplace technologies.',
        content: 'Remote Work Revolution: How Companies Are Adapting in 2025\n\nThe workplace has fundamentally changed since 2020...',
        thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=250&fit=crop',
        readingTime: '7 min read',
        dateAdded: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isFavorite: false,
        isArchived: false,
        readProgress: 30,
        tags: ['remote-work', 'business', 'trends', 'workplace']
      },
      {
        id: Date.now().toString() + '5',
        url: 'https://developer.mozilla.org/web-components-guide',
        type: 'Article',
        title: 'Modern Web Development: A Complete Guide to Web Components',
        excerpt: 'Learn how to build reusable, encapsulated HTML elements using Web Components. Covers Custom Elements, Shadow DOM, and HTML Templates with practical examples.',
        content: 'Modern Web Development: A Complete Guide to Web Components\n\nWeb Components represent a suite of different technologies...',
        thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
        readingTime: '12 min read',
        dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isFavorite: true,
        isArchived: false,
        readProgress: 85,
        tags: ['web-development', 'javascript', 'components', 'frontend']
      }
    ];
    
    // Save sample articles
    sampleArticles.forEach(article => {
      StorageManager.saveItem(article);
    });
    
    setSavedItems(sampleArticles);
    setShowLanding(false);
  };

  const handleGetStarted = () => {
    // Create sample data when user gets started
    createSampleData();
    // Hide landing page and show the app
    setShowLanding(false);
  };

  const handleSaveItem = async (item) => {
    try {
      const success = StorageManager.saveItem(item);
      if (success) {
        setSavedItems(prev => [item, ...prev]);
        return true;
      }
      throw new Error('Failed to save item');
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  };

  const handleItemSelect = (item) => {
    setCurrentItem(item);
  };

  const handleItemDelete = (itemId) => {
    const success = StorageManager.deleteItem(itemId);
    if (success) {
      setSavedItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleCloseReader = () => {
    setCurrentItem(null);
  };

  const handleUpdateProgress = (itemId, progress) => {
    const success = StorageManager.updateItem(itemId, { readProgress: progress });
    if (success) {
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, readProgress: progress } : item
        )
      );
    }
  };

  const handleToggleFavorite = (itemId) => {
    const item = savedItems.find(item => item.id === itemId);
    if (item) {
      const newFavoriteStatus = !item.isFavorite;
      const success = StorageManager.updateItem(itemId, { isFavorite: newFavoriteStatus });
      if (success) {
        setSavedItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, isFavorite: newFavoriteStatus } : item
          )
        );
      }
    }
  };

  const handleArchiveItem = (itemId) => {
    const item = savedItems.find(item => item.id === itemId);
    if (item) {
      const newArchivedStatus = !item.isArchived;
      const success = StorageManager.updateItem(itemId, { isArchived: newArchivedStatus });
      if (success) {
        setSavedItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, isArchived: newArchivedStatus } : item
          )
        );
      }
    }
  };

  const handleAddTag = (itemId, tag) => {
    const success = StorageManager.addTag(itemId, tag);
    if (success) {
      setSavedItems(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            const tags = item.tags || [];
            if (!tags.includes(tag)) {
              return { ...item, tags: [...tags, tag] };
            }
          }
          return item;
        })
      );
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-graphik">Loading Booklet...</p>
        </div>
      </div>
    );
  }

  // Show reader view if an item is selected
  if (currentItem) {
    return (
      <ReaderView 
        item={currentItem}
        onClose={handleCloseReader}
        onUpdateProgress={handleUpdateProgress}
      />
    );
  }

  // Show landing page
  if (showLanding) {
    return (
      <LandingPage 
        onGetStarted={handleGetStarted}
      />
    );
  }

  return (
  <div className="min-h-screen bg-white flex flex-col">
      {/* Pocket-style Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 font-graphik">Booklet</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setShowLanding(!showLanding)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title={showLanding ? "View App" : "Home"}
              >
                {showLanding ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowAddDialog(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-2 font-graphik"
              >
                <span>+</span>
                <span>Add</span>
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && (
            <div className="mt-3 pb-1">
              <input
                type="text"
                placeholder="Search your articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-graphik"
                autoFocus
              />
            </div>
          )}
          
          {/* Navigation Tabs */}
          <div className="flex space-x-0 mt-3 border-b border-gray-100 -mb-3">
            <button
              onClick={() => setCurrentView('mylist')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors font-graphik ${
                currentView === 'mylist'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My List
            </button>
            <button
              onClick={() => setCurrentView('favorites')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors font-graphik ${
                currentView === 'favorites'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setCurrentView('archive')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors font-graphik ${
                currentView === 'archive'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Archive
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 flex-1">
        {/* Quick Stats */}
        <div className="mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white border border-gray-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-900 font-graphik">{savedItems.length}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-red-500 font-graphik">
              {savedItems.filter(item => item.isFavorite).length}
            </div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-blue-500 font-graphik">
              {savedItems.filter(item => item.isArchived).length}
            </div>
            <div className="text-xs text-gray-500">Archived</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-500 font-graphik">
              {savedItems.filter(item => item.readProgress === 100).length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        <SavedItemsList
          savedItems={filteredItems}
          onItemSelect={handleItemSelect}
          onItemDelete={handleItemDelete}
          onToggleFavorite={handleToggleFavorite}
          onArchiveItem={handleArchiveItem}
          onAddTag={handleAddTag}
          currentView={currentView}
        />
      </main>

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}

export default App;