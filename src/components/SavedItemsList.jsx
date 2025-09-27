import { useState, useEffect } from 'react';

const SavedItemsList = ({ 
  savedItems, 
  onItemSelect, 
  onItemDelete, 
  onToggleFavorite, 
  onArchiveItem, 
  onAddTag, 
  currentView 
}) => {
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'title', 'type'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'articles', 'pdfs'

  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">📚</span>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2 font-graphik">
          {currentView === 'favorites' ? 'No favorites yet' : 
           currentView === 'archive' ? 'No archived items' : 
           'Your list is empty'}
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          {currentView === 'favorites' ? 'Items you favorite will appear here' :
           currentView === 'archive' ? 'Archived items will appear here' :
           'Tap the Add button to save your first article'}
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
    <div>
      {/* Simple list like Pocket */}
      <div className="space-y-4">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex items-start space-x-4"
            onClick={() => onItemSelect(item)}
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-400">{getTypeIcon(item.type)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-gray-900 line-clamp-2 font-graphik flex-1">
                  {item.title}
                </h3>
                <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                  {item.isFavorite && (
                    <span className="text-red-500" title="Favorite">❤️</span>
                  )}
                  {item.isArchived && (
                    <span className="text-blue-500" title="Archived">📁</span>
                  )}
                  {item.readProgress === 100 && (
                    <span className="text-green-500" title="Completed">✅</span>
                  )}
                  {item.type === 'PDF' && (
                    <span className="text-red-600 text-xs bg-red-50 px-1 rounded" title="PDF Document">PDF</span>
                  )}
                </div>
              </div>
              
              {item.excerpt && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {item.excerpt}
                </p>
              )}
              
              {/* Reading Progress Bar */}
              {item.readProgress && item.readProgress > 0 && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${item.readProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.readProgress}% complete
                    {item.readProgress === 100 && (
                      <span className="ml-1 text-green-600">✓ Finished</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>{formatDate(item.dateAdded)}</span>
                  {item.readingTime && (
                    <>
                      <span>•</span>
                      <span>{item.readingTime}</span>
                    </>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>•</span>
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="text-blue-500 cursor-pointer hover:text-blue-700">#{tag}</span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-gray-400">+{item.tags.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`p-1 transition-colors ${
                      item.isFavorite 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg className="w-4 h-4" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  
                  {/* Archive Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveItem(item.id);
                    }}
                    className={`p-1 transition-colors ${
                      item.isArchived 
                        ? 'text-blue-500 hover:text-blue-600' 
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title={item.isArchived ? "Unarchive" : "Archive"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                    </svg>
                  </button>
                  
                  {/* Tag Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const tag = prompt('Add a tag:');
                      if (tag) onAddTag(item.id, tag);
                    }}
                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                    title="Add tag"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemDelete(item.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 7a1 1 0 012 0v8a1 1 0 11-2 0V7zm6 0a1 1 0 10-2 0v8a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedItemsList;