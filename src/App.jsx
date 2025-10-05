import { useState, useEffect, useRef } from 'react';
import SavedItemsList from './components/SavedItemsList';
import AddItemDialog from './components/AddItemDialog';
import ReaderView from './components/ReaderView';
import LandingPage from './components/LandingPage';
import { StorageManager } from './utils/storage';
import { UnifiedStorageManager } from './utils/unifiedStorage';
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
  const [storageManager, setStorageManager] = useState(null);
  const { showToast } = useToast();
  const [currentItem, setCurrentItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('all'); // 'all', 'mylist', 'favorites', 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const userMenuRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Initialize storage manager and load items when user changes
  useEffect(() => {
    const initializeStorage = async () => {
      const manager = new UnifiedStorageManager(user);
      setStorageManager(manager);
      
      if (user) {
        setShowLanding(false);
        // Sync local data to Supabase if user just signed in
        await manager.syncToSupabase();
      }
      
      // Load items
      try {
        const items = await manager.getAllItems();
        setSavedItems(items);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeStorage();
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
    // First filter by view
    let matchesView = true;
    
    switch (currentView) {
      case 'all': // All non-archived items
        matchesView = !item.isArchived;
        break;
      case 'mylist': // Unread items
        matchesView = !item.isArchived && (!item.isRead && item.readProgress < 90);
        break;
      case 'read': // Read items
        matchesView = !item.isArchived && (item.isRead || item.readProgress >= 90);
        break;
      case 'favorites': // Starred items
        matchesView = !item.isArchived && item.isFavorite;
        break;
      case 'archive': // Archived items
        matchesView = item.isArchived;
        break;
      default:
        matchesView = !item.isArchived; // Default to showing all non-archived
    }
    
    // Then filter by search query if provided
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesView && matchesSearch;
  });

  // Get counts for each view
  const getViewCounts = () => {
    const unreadCount = savedItems.filter(item => 
      !item.isArchived && (!item.isRead && item.readProgress < 90)
    ).length;
    
    const readCount = savedItems.filter(item => 
      !item.isArchived && (item.isRead || item.readProgress >= 90)
    ).length;
    
    const starredCount = savedItems.filter(item => 
      !item.isArchived && item.isFavorite
    ).length;
    
    const archivedCount = savedItems.filter(item => 
      item.isArchived
    ).length;
    
    const allCount = savedItems.filter(item => !item.isArchived).length;
    
    return { unreadCount, readCount, starredCount, archivedCount, allCount };
  };

  const { unreadCount, readCount, starredCount, archivedCount, allCount } = getViewCounts();

  // Close search overlay when clicking outside or when ESC is pressed
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };

    if (showSearch) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showSearch]);



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

  const handleUpdateProgress = async (itemId, progress) => {
    if (!storageManager) return;
    
    try {
      await storageManager.updateProgress(itemId, progress);
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            readProgress: progress,
            isRead: progress >= 90,
            lastRead: new Date().toISOString()
          } : item
        )
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleToggleFavorite = async (itemId) => {
    if (!storageManager) return;
    
    const item = savedItems.find(item => item.id === itemId);
    if (item) {
      const newFavoriteStatus = !item.isFavorite;
      try {
        await storageManager.toggleFavorite(itemId);
        setSavedItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, isFavorite: newFavoriteStatus } : item
          )
        );
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  };

  const handleArchiveItem = async (itemId) => {
    if (!storageManager) return;
    
    const item = savedItems.find(item => item.id === itemId);
    if (item) {
      const newArchivedStatus = !item.isArchived;
      try {
        await storageManager.toggleArchive(itemId);
        setSavedItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, isArchived: newArchivedStatus } : item
          )
        );
      } catch (error) {
        console.error('Failed to toggle archive:', error);
      }
    }
  };

  const handleAddTag = async (itemId, tag) => {
    if (!storageManager) return;
    
    try {
      await storageManager.addTag(itemId, tag);
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
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (itemId, tag) => {
    if (!storageManager) return;
    
    try {
      await storageManager.removeTag(itemId, tag);
      setSavedItems(prev => 
        prev.map(item => {
          if (item.id === itemId) {
            const tags = item.tags || [];
            return { ...item, tags: tags.filter(t => t !== tag) };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const handleMarkAsRead = async (itemId) => {
    if (!storageManager) return;
    
    try {
      await storageManager.markAsRead(itemId);
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            readProgress: 100, 
            isRead: true,
            lastRead: new Date().toISOString()
          } : item
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAsUnread = async (itemId) => {
    if (!storageManager) return;
    
    try {
      await storageManager.markAsUnread(itemId);
      setSavedItems(prev => 
        prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            readProgress: 0, 
            isRead: false
          } : item
        )
      );
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!storageManager) return;
    
    try {
      await storageManager.deleteItem(itemId);
      setSavedItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <p className="text-gray-600 font-light">Loading...</p>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Clipit-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h1 className="text-xl font-light text-gray-900">Clipit</h1>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
              {/* Creative Search - Mobile: Icon only, Desktop: Expandable */}
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`relative group flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-none transition-all duration-300 font-light transform ${
                    showSearch 
                      ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-xl scale-110 rotate-12 md:bg-transparent md:text-gray-900 md:scale-100 md:rotate-0 md:shadow-none' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 active:scale-95 shadow-lg border border-gray-100 md:bg-transparent md:hover:text-gray-900 md:shadow-none md:border-none hover:scale-105 md:hover:scale-100'
                  }`}
                  title="Search articles"
                >
                  <svg className={`w-5 h-5 md:w-4 md:h-4 transition-transform duration-300 ${showSearch ? 'rotate-90 md:rotate-0' : 'group-hover:scale-110 md:group-hover:scale-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden md:inline md:ml-2">Search</span>
                  {/* Mobile-only active pulse effect */}
                  {showSearch && (
                    <div className="absolute inset-0 rounded-full bg-gray-800 animate-ping opacity-20 md:hidden"></div>
                  )}
                </button>
                
                {/* Mobile: Creative Overlay Search */}
                {showSearch && (
                  <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-16 px-4 animate-fadeIn"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setShowSearch(false);
                    }}
                  >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-slideDown">
                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">C</span>
                          </div>
                          <h3 className="text-xl font-light text-gray-900 flex-1">Search Articles</h3>
                          <button
                            onClick={() => setShowSearch(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="relative mb-4">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="What are you looking for?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 font-light text-lg placeholder-gray-400 bg-gray-50 focus:bg-white transition-all duration-200"
                            autoFocus
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        {searchQuery && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-light text-gray-600">
                                {filteredItems.length} article{filteredItems.length !== 1 ? 's' : ''} found
                              </span>
                            </div>
                            <button
                              onClick={() => setShowSearch(false)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              View Results
                            </button>
                          </div>
                        )}
                        
                        {!searchQuery && (
                          <div className="text-center py-4">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <p className="text-sm font-light text-gray-500">
                              Start typing to search through your saved articles
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowAddDialog(true)}
                className="relative group flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2 bg-gradient-to-br from-blue-500 to-blue-700 md:from-gray-800 md:to-gray-800 text-white rounded-full md:rounded font-light hover:from-blue-600 hover:to-blue-800 md:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 md:hover:scale-100 active:scale-95"
                title="Add article"
              >
                <svg className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-200 group-hover:rotate-90 md:group-hover:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline md:ml-2">Add URL</span>
                {/* Mobile-only glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 md:hidden"></div>
              </button>
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <div className="flex items-center">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)} 
                      className={`relative flex items-center space-x-2 focus:outline-none rounded-full p-1 transition-all duration-300 transform ${
                        showUserMenu 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-xl scale-110 -rotate-12 md:bg-gray-100 md:scale-100 md:rotate-0 md:shadow-none' 
                          : 'hover:bg-gray-100 hover:scale-105 md:hover:scale-100 active:scale-95'
                      }`}
                    >
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="avatar" 
                          className={`w-8 h-8 rounded-full object-cover transition-all duration-300 ${
                            showUserMenu 
                              ? 'ring-2 ring-white shadow-lg' 
                              : 'ring-2 ring-gray-200 hover:ring-gray-300'
                          }`} 
                        />
                      ) : (
                        <div className={`w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center text-sm font-medium shadow-md transition-all duration-300 ${
                          showUserMenu 
                            ? 'from-white to-gray-100 text-purple-600 shadow-lg' 
                            : 'from-gray-400 to-gray-600 text-white hover:from-gray-500 hover:to-gray-700'
                        }`}>
                          {(user.email || '').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Active state indicator */}
                      {showUserMenu && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white md:hidden animate-pulse"></div>
                      )}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 text-sm font-light text-gray-700 border-b border-gray-100 bg-gray-50">
                          {profile?.full_name ?? user.email}
                        </div>
                        <button 
                          onClick={async () => { 
                            const ok = confirm('Sign out?'); 
                            if (!ok) return; 
                            await signOut(); 
                            setShowLanding(true); 
                            showToast({ type: 'success', message: 'Signed out' }); 
                          }} 
                          className="w-full text-left px-4 py-3 text-sm font-light text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setAuthModalOpen(true)} 
                    className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2 bg-gray-800 text-white rounded-full md:rounded font-light hover:bg-gray-700 transition-all duration-200 shadow-lg"
                    title="Sign in"
                  >
                    <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden md:inline md:ml-2">Log In</span>
                  </button>
                )}
                <SupabaseAuth
                  isOpen={authModalOpen}
                  onClose={() => setAuthModalOpen(false)}
                  onSignedIn={(u) => {
                    if (u) setAuthModalOpen(false);
                  }}
                />
                <ProfileDialog isOpen={showProfileDialog} onClose={() => setShowProfileDialog(false)} />
              </div>
            </div>
          </div>
          
          {/* Desktop Search Bar */}
          {showSearch && (
            <div className="hidden md:block mt-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search your articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 font-light transition-all duration-200"
                  autoFocus
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-500 font-light">
                  {filteredItems.length} articles found
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('all')}
              className={`py-4 text-sm font-light border-b-2 transition-colors flex items-center space-x-2 ${
                currentView === 'all'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>All</span>
              {allCount > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {allCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('mylist')}
              className={`py-4 text-sm font-light border-b-2 transition-colors flex items-center space-x-2 ${
                currentView === 'mylist'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('read')}
              className={`py-4 text-sm font-light border-b-2 transition-colors flex items-center space-x-2 ${
                currentView === 'read'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Read</span>
              {readCount > 0 && (
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                  {readCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('favorites')}
              className={`py-4 text-sm font-light border-b-2 transition-colors flex items-center space-x-2 ${
                currentView === 'favorites'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Starred</span>
              {starredCount > 0 && (
                <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
                  {starredCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('archive')}
              className={`py-4 text-sm font-light border-b-2 transition-colors flex items-center space-x-2 ${
                currentView === 'archive'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Archive</span>
              {archivedCount > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8">

        <SavedItemsList
          savedItems={filteredItems}
          onItemSelect={handleItemSelect}
          onItemDelete={handleDeleteItem}
          onToggleFavorite={handleToggleFavorite}
          onArchiveItem={handleArchiveItem}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
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