// Simple localStorage-based storage for saved items
// In a production app, you'd want to use IndexedDB for better performance and storage limits

const STORAGE_KEY = 'clipit-saved-items';

const getStorageKey = (userId) => `clipit-saved-items-${userId || 'anonymous'}`;

export const StorageManager = {
  // Get all saved items
  getAllItems: (userId) => {
    try {
      const items = localStorage.getItem(getStorageKey(userId));
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Failed to load saved items:', error);
      return [];
    }
  },

  // Save a new item
  saveItem: (item, userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      const newItems = [item, ...items];
      localStorage.setItem(getStorageKey(userId), JSON.stringify(newItems));
      return true;
    } catch (error) {
      console.error('Failed to save item:', error);
      return false;
    }
  },

  // Update an existing item
  updateItem: (itemId, updates, userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedItems));
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      return false;
    }
  },

  // Delete an item
  deleteItem: (itemId, userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      const filteredItems = items.filter(item => item.id !== itemId);
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  },

  // Get a single item by ID
  getItem: (itemId, userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      return items.find(item => item.id === itemId);
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  },

  // Update reading progress
  updateProgress: (itemId, progress, userId) => {
    return StorageManager.updateItem(itemId, { 
      readProgress: Math.max(0, Math.min(100, progress)),
      lastRead: new Date().toISOString()
    }, userId);
  },

  // Toggle favorite status
  toggleFavorite: (itemId, userId) => {
    try {
      const item = StorageManager.getItem(itemId, userId);
      if (item) {
        return StorageManager.updateItem(itemId, { 
          isFavorite: !item.isFavorite 
        }, userId);
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  },

  // Toggle archive status
  toggleArchive: (itemId, userId) => {
    try {
      const item = StorageManager.getItem(itemId, userId);
      if (item) {
        return StorageManager.updateItem(itemId, { 
          isArchived: !item.isArchived 
        }, userId);
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      return false;
    }
  },

  // Mark as read (readProgress >= 90)
  markAsRead: (itemId, userId) => {
    return StorageManager.updateItem(itemId, { 
      readProgress: 100,
      lastRead: new Date().toISOString(),
      isRead: true
    }, userId);
  },

  // Mark as unread
  markAsUnread: (itemId, userId) => {
    return StorageManager.updateItem(itemId, { 
      readProgress: 0,
      isRead: false
    }, userId);
  },

    // Add tags to an item
  addTag: (itemId, tag, userId) => {
    try {
      const item = StorageManager.getItem(itemId, userId);
      if (item) {
        const tags = item.tags || [];
        if (!tags.includes(tag)) {
          return StorageManager.updateItem(itemId, { 
            tags: [...tags, tag] 
          }, userId);
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to add tag:', error);
      return false;
    }
  },

    // Remove tag from an item
  removeTag: (itemId, tag, userId) => {
    try {
      const item = StorageManager.getItem(itemId, userId);
      if (item) {
        const tags = item.tags || [];
        return StorageManager.updateItem(itemId, { 
          tags: tags.filter(t => t !== tag) 
        }, userId);
      }
      return false;
    } catch (error) {
      console.error('Failed to remove tag:', error);
      return false;
    }
  },

  // Get storage statistics
  getStats: (userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      const totalItems = items.length;
      const articles = items.filter(item => item.type !== 'PDF').length;
      const pdfs = items.filter(item => item.type === 'PDF').length;
      const favorites = items.filter(item => item.isFavorite).length;
      const readItems = items.filter(item => item.readProgress >= 90).length;
      
      // Calculate storage usage (approximate)
      const storageUsed = JSON.stringify(items).length;
      const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2);
      
      return {
        totalItems,
        articles,
        pdfs,
        favorites,
        readItems,
        storageUsedMB
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalItems: 0,
        articles: 0,
        pdfs: 0,
        favorites: 0,
        readItems: 0,
        storageUsedMB: '0.00'
      };
    }
  },

  // Export all data (for backup)
  exportData: (userId) => {
    try {
      const items = StorageManager.getAllItems(userId);
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        items: items
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  },

  // Import data (from backup)
  importData: (jsonData, userId) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.items && Array.isArray(data.items)) {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(data.items));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  // Clear all data
  clearAll: (userId) => {
    try {
      localStorage.removeItem(getStorageKey(userId));
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
};