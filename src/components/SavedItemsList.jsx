import { useState, useEffect } from 'react';

const SavedItemsList = ({ 
  savedItems, 
  onItemSelect, 
  onItemDelete, 
  onToggleFavorite, 
  onArchiveItem, 
  onAddTag, 
  onRemoveTag,
  onMarkAsRead,
  onMarkAsUnread,
  currentView 
}) => {
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterBy, setFilterBy] = useState('all');

  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-3">
          {currentView === 'favorites' ? 'No starred articles' : 
           currentView === 'archive' ? 'No archived articles' : 
           'No articles saved yet'}
        </h2>
        <p className="text-gray-500 font-light max-w-md leading-relaxed">
          {currentView === 'favorites' ? 'Articles you star will appear here for easy access.' :
           currentView === 'archive' ? 'Articles you archive will be stored here.' :
           'Save your first article by clicking "Add URL" above.'}
        </p>
      </div>
    );
  }

  const getFilteredAndSortedItems = () => {
    let filtered = savedItems;
    
    // Filter by type
    if (filterBy === 'articles') {
      filtered = filtered.filter(item => item.type !== 'PDF');
    } else if (filterBy === 'pdfs') {
      filtered = filtered.filter(item => item.type === 'PDF');
    }
    
    // Sort items
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'dateAdded':
        default:
          return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'Article': return '📰';
      case 'Markdown': return '📝';
      case 'HTML': return '🌐';
      case 'JSON': return '📊';
      case 'CSV': return '📈';
      default: return '📄';
    }
  };

  const getReadingTime = (content) => {
    if (!content) return null;
    const words = content.split(' ').length;
    const readingTime = Math.ceil(words / 200); // Average reading speed
    return `${readingTime} min read`;
  };

  const sortedItems = getFilteredAndSortedItems();

  return (
    <div className="space-y-1">
      {sortedItems.map((item) => (
        <article
          key={item.id}
          className={`bg-white border-b border-gray-100 p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer group relative ${
            item.isRead || item.readProgress >= 90 ? 'opacity-75' : ''
          }`}
          onClick={() => onItemSelect(item)}
        >
          {/* Reading progress indicator */}
          {item.readProgress > 0 && (
            <div className="absolute top-0 left-0 h-1 bg-gray-100 w-full">
              <div 
                className="h-1 bg-blue-500 transition-all duration-300"
                style={{ width: `${item.readProgress}%` }}
              />
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2 md:pr-4">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className={`text-lg font-light leading-tight line-clamp-2 ${
                  item.isRead || item.readProgress >= 90 
                    ? 'text-gray-600' 
                    : 'text-gray-900'
                }`}>
                  {item.title}
                </h2>
                
                {/* Read status indicator */}
                {(item.isRead || item.readProgress >= 90) && (
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                
                {/* Favorite indicator */}
                {item.isFavorite && (
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {item.excerpt && (
                <p className="text-gray-600 font-light leading-relaxed mb-3 line-clamp-3">
                  {item.excerpt}
                </p>
              )}
              
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="font-light">{formatDate(item.dateAdded)}</span>
                {item.readingTime && (
                  <span className="font-light">{item.readingTime}</span>
                )}
                {item.readProgress > 0 && (
                  <span className="font-light">{item.readProgress}% read</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 md:space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {/* Read/Unread Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.isRead || item.readProgress >= 90) {
                    onMarkAsUnread(item.id);
                  } else {
                    onMarkAsRead(item.id);
                  }
                }}
                className={`p-2 md:p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-full md:rounded-none hover:bg-gray-100 md:hover:bg-transparent ${
                  item.isRead || item.readProgress >= 90 ? 'text-green-600' : ''
                }`}
                title={item.isRead || item.readProgress >= 90 ? "Mark as unread" : "Mark as read"}
              >
                <svg className="w-5 h-5" fill={item.isRead || item.readProgress >= 90 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Star Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
                className={`p-2 md:p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-full md:rounded-none hover:bg-gray-100 md:hover:bg-transparent ${
                  item.isFavorite ? 'text-yellow-500' : ''
                }`}
                title={item.isFavorite ? "Unstar" : "Star"}
              >
                <svg className="w-5 h-5" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveItem(item.id);
                }}
                className="p-2 md:p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-full md:rounded-none hover:bg-gray-100 md:hover:bg-transparent"
                title={item.isArchived ? "Unarchive" : "Archive"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8l6 6 6-6" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemDelete(item.id);
                }}
                className="p-2 md:p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full md:rounded-none hover:bg-gray-100 md:hover:bg-transparent"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default SavedItemsList;