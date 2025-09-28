import { useState, useEffect, useRef } from 'react';
import SavedItemsList from './components/SavedItemsList';
import AddItemDialog from './components/AddItemDialog';
import ReaderView from './components/ReaderView';
import LandingPage from './components/LandingPage';
import { StorageManager } from './utils/storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Toaster from './components/Toaster';
import SupabaseAuth from './components/SupabaseAuth';
import ProfileDialog from './components/ProfileDialog';

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

function AppInner() {
  const [savedItems, setSavedItems] = useState([]);
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [currentItem, setCurrentItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('mylist'); // 'mylist', 'favorites', 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const userMenuRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // If the user is signed in, skip the landing page
  useEffect(() => {
    if (user) setShowLanding(false);
  }, [user]);

  // close user menu when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    // Load saved items on app start and when user changes
    loadSavedItems();
  }, [user]);

  const loadSavedItems = () => {
    try {
      let items = StorageManager.getAllItems(user?.id);
      setSavedItems(items);
    } catch (error) {
      console.error('Failed to load saved items:', error);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    // Hide landing page and show the app
    setShowLanding(false);
  };

  const handleSaveItem = async (item) => {
    try {
      const success = StorageManager.saveItem(item, user?.id);
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
    const success = StorageManager.deleteItem(itemId, user?.id);
    if (success) {
      setSavedItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleCloseReader = () => {
    setCurrentItem(null);
  };

  const handleUpdateProgress = (itemId, progress) => {
    const success = StorageManager.updateItem(itemId, { readProgress: progress }, user?.id);
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
      const success = StorageManager.updateItem(itemId, { isFavorite: newFavoriteStatus }, user?.id);
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
      const success = StorageManager.updateItem(itemId, { isArchived: newArchivedStatus }, user?.id);
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
    const success = StorageManager.addTag(itemId, tag, user?.id);
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
        userId={user?.id ?? null}
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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 font-graphik flex items-center">Booklet</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
           
                
              
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
              <div className="ml-2 relative" ref={userMenuRef}>
                {user ? (
                  <div className="flex items-center">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 focus:outline-none">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-800 dark:text-gray-100">{(user.email || '').charAt(0).toUpperCase()}</div>
                      )}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded shadow-lg z-50">
                        <div className="px-4 py-2 text-sm text-gray-700">{profile?.full_name ?? user.email}</div>
                        <div className="border-t border-gray-100" />
                        <button onClick={async () => { const ok = confirm('Sign out of Booklet?'); if (!ok) return; await signOut(); setShowLanding(true); showToast({ type: 'success', message: 'Signed out' }); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Sign out</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setAuthModalOpen(true)} className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-2 font-graphik">Sign in</button>
                )}
                <SupabaseAuth
                  isOpen={authModalOpen}
                  onClose={() => setAuthModalOpen(false)}
                  onSignedIn={(u) => {
                    // close modal when a user is present
                    if (u) setAuthModalOpen(false);
                  }}
                />
                <ProfileDialog isOpen={showProfileDialog} onClose={() => setShowProfileDialog(false)} />
              </div>
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

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppInner />
      <Toaster />
    </ToastProvider>
  </AuthProvider>
);

export default App;