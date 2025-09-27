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
  const [showLanding, setShowLanding] = useState(false);

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
      
      // Force refresh with new sample data (remove this line in production)
      // StorageManager.clearAll();
      // items = [];
      
      // Show landing page if no items (comment this for demo with sample data)
      // if (items.length === 0) {
      //   setShowLanding(true);
      //   return;
      // }
      
      // Add sample articles if empty
      if (items.length === 0) {
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
            dateAdded: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
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
            dateAdded: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
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
            dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
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
            dateAdded: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
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
            dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            isFavorite: true,
            isArchived: false,
            readProgress: 85,
            tags: ['web-development', 'javascript', 'components', 'frontend']
          },
          {
            id: Date.now().toString() + '6',
            url: 'https://www.nature.com/quantum-computing-breakthrough.pdf',
            type: 'PDF',
            title: 'Quantum Computing Breakthrough: 1000-Qubit Processor Achieved',
            excerpt: 'Research paper detailing the development of the first stable 1000-qubit quantum processor and its implications for cryptography and scientific computing.',
            content: 'Quantum Computing Breakthrough: 1000-Qubit Processor Achieved\n\nAbstract\n\nWe present the successful development...',
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
            readingTime: '20 min read',
            dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            isFavorite: true,
            isArchived: true,
            readProgress: 25,
            tags: ['quantum-computing', 'research', 'technology', 'science']
          },
          {
            id: Date.now().toString() + '7',
            url: 'https://blog.example.com/sustainable-living',
            type: 'Article',
            title: 'Sustainable Living: Small Changes That Make a Big Impact',
            excerpt: 'Practical tips for reducing your environmental footprint without compromising your lifestyle. From energy-saving techniques to eco-friendly product choices.',
            content: 'Sustainable Living: Small Changes That Make a Big Impact\n\nLiving sustainably doesn\'t require dramatic lifestyle changes...',
            thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=250&fit=crop',
            readingTime: '6 min read',
            dateAdded: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            isFavorite: false,
            isArchived: false,
            readProgress: 0,
            tags: ['sustainability', 'environment', 'lifestyle', 'green-living']
          },
          {
            id: Date.now().toString() + '8',
            url: 'https://finance.yahoo.com/crypto-analysis',
            type: 'Article',
            title: 'Cryptocurrency Market Analysis: What to Expect in Q4 2025',
            excerpt: 'Comprehensive analysis of cryptocurrency trends, institutional adoption, and regulatory changes affecting the digital asset market in the final quarter of 2025.',
            content: 'Cryptocurrency Market Analysis: What to Expect in Q4 2025\n\nThe cryptocurrency market has experienced significant evolution...',
            thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
            readingTime: '9 min read',
            dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            isFavorite: false,
            isArchived: true,
            readProgress: 50,
            tags: ['cryptocurrency', 'finance', 'market-analysis', 'investing']
          },
          {
            id: Date.now().toString() + '9',
            url: 'https://www.healthline.com/mental-health-guide',
            type: 'Article',
            title: 'Mental Health in the Digital Age: Coping Strategies for 2025',
            excerpt: 'Expert advice on maintaining mental wellness while navigating social media, remote work, and digital overwhelm. Includes mindfulness techniques and digital detox strategies.',
            content: 'Mental Health in the Digital Age: Coping Strategies for 2025\n\nAs we become increasingly connected...',
            thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
            readingTime: '8 min read',
            dateAdded: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            isFavorite: true,
            isArchived: false,
            readProgress: 45,
            tags: ['mental-health', 'wellness', 'digital-wellness', 'mindfulness']
          },
          {
            id: Date.now().toString() + '10',
            url: 'https://spacenews.com/mars-mission-update.pdf',
            type: 'PDF',
            title: 'Mars Mission 2025: Technical Documentation and Mission Timeline',
            excerpt: 'Official documentation for the upcoming Mars mission including spacecraft specifications, crew training protocols, and detailed mission timeline.',
            content: 'Mars Mission 2025: Technical Documentation\n\nMission Overview\n\nThis document outlines the comprehensive plan...',
            thumbnail: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=250&fit=crop',
            readingTime: '25 min read',
            dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
            isFavorite: false,
            isArchived: true,
            readProgress: 10,
            tags: ['space', 'mars', 'mission', 'nasa', 'exploration']
          },
          {
            id: Date.now().toString() + '11',
            url: 'https://www.wired.com/cybersecurity-2025',
            type: 'Article',
            title: 'Cybersecurity Trends 2025: Protecting Against Next-Gen Threats',
            excerpt: 'Essential cybersecurity strategies for businesses and individuals. Covers AI-powered attacks, zero-trust architecture, and emerging security technologies.',
            content: 'Cybersecurity Trends 2025: Protecting Against Next-Gen Threats\n\nCybersecurity has become more critical than ever...',
            thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop',
            readingTime: '11 min read',
            dateAdded: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
            isFavorite: false,
            isArchived: false,
            readProgress: 75,
            tags: ['cybersecurity', 'security', 'technology', 'threats']
          },
          {
            id: Date.now().toString() + '12',
            url: 'https://education.example.com/learning-methods.pdf',
            type: 'PDF',
            title: 'Effective Learning Methods: Research-Based Study Techniques',
            excerpt: 'Academic research on the most effective learning techniques, including spaced repetition, active recall, and metacognitive strategies for improved retention.',
            content: 'Effective Learning Methods: Research-Based Study Techniques\n\nIntroduction\n\nThis comprehensive guide presents evidence-based learning strategies...',
            thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
            readingTime: '18 min read',
            dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
            isFavorite: true,
            isArchived: false,
            readProgress: 90,
            tags: ['education', 'learning', 'study-methods', 'research']
          }
        ];
        
        // Save sample articles
        sampleArticles.forEach(article => {
          StorageManager.saveItem(article);
        });
        
        items = sampleArticles;
      }
      
      setSavedItems(items);
    } catch (error) {
      console.error('Failed to load saved items:', error);
    } finally {
      setLoading(false);
    }
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

  const handleCloseReader = () => {
    setCurrentItem(null);
  };

  const handleItemDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const success = StorageManager.deleteItem(itemId);
      if (success) {
        setSavedItems(prev => prev.filter(item => item.id !== itemId));
      }
    }
  };

  const handleUpdateProgress = (itemId, progress) => {
    StorageManager.updateProgress(itemId, progress);
    setSavedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, readProgress: progress, lastRead: new Date().toISOString() }
          : item
      )
    );
  };

  const handleToggleFavorite = (itemId) => {
    StorageManager.toggleFavorite(itemId);
    setSavedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleArchiveItem = (itemId) => {
    const success = StorageManager.updateItem(itemId, { isArchived: true });
    if (success) {
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, isArchived: true } : item
        )
      );
    }
  };

  const handleUnarchiveItem = (itemId) => {
    const success = StorageManager.updateItem(itemId, { isArchived: false });
    if (success) {
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, isArchived: false } : item
        )
      );
    }
  };

  const handleAddTag = (itemId, tag) => {
    const success = StorageManager.addTag(itemId, tag);
    if (success) {
      setSavedItems(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            const tags = item.tags || [];
            return { ...item, tags: [...new Set([...tags, tag])] };
          }
          return item;
        })
      );
    }
  };

  const handleRemoveTag = (itemId, tag) => {
    const success = StorageManager.removeTag(itemId, tag);
    if (success) {
      setSavedItems(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            const tags = (item.tags || []).filter(t => t !== tag);
            return { ...item, tags };
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Booklet...</p>
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
        onGetStarted={() => setShowLanding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Pocket-style Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 font-graphik">Booklet</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLanding(!showLanding)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title={showLanding ? "Back to App" : "View Landing"}
              >
                {showLanding ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              {!showLanding && (
                <>
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
                </>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && !showLanding && (
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
          {!showLanding && (
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
          )}
        </div>
      </header>

      {/* Main Content */}
      {!showLanding && (
        <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 font-graphik">{savedItems.length}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-500 font-graphik">
              {savedItems.filter(item => item.isFavorite).length}
            </div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-500 font-graphik">
              {savedItems.filter(item => item.isArchived).length}
            </div>
            <div className="text-xs text-gray-500">Archived</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500 font-graphik">
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
      )}

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSaveItem}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p className="font-medium">Booklet - Personal Library</p>
            <div className="flex justify-center space-x-6">
              <span>� Save & Read Later</span>
              <span>�💾 Offline Reading</span>
              <span>📱 PWA Support</span>
              <span>🎯 Distraction-Free</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
