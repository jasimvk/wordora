// Simple localStorage-based storage for saved items
// In a production app, you'd want to use IndexedDB for better performance and storage limits

const STORAGE_KEY = 'booklet-saved-items';

export const StorageManager = {
  // Get all saved items
  getAllItems: () => {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Failed to load saved items:', error);
      return [];
    }
  },

  // Save a new item
  saveItem: (item) => {
    try {
      const items = StorageManager.getAllItems();
      const newItems = [item, ...items];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return true;
    } catch (error) {
      console.error('Failed to save item:', error);
      return false;
    }
  },

  // Update an existing item
  updateItem: (itemId, updates) => {
    try {
      const items = StorageManager.getAllItems();
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      return true;
    } catch (error) {
      console.error('Failed to update item:', error);
      return false;
    }
  },

  // Delete an item
  deleteItem: (itemId) => {
    try {
      const items = StorageManager.getAllItems();
      const filteredItems = items.filter(item => item.id !== itemId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  },

  // Get a single item by ID
  getItem: (itemId) => {
    try {
      const items = StorageManager.getAllItems();
      return items.find(item => item.id === itemId);
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  },

  // Update reading progress
  updateProgress: (itemId, progress) => {
    return StorageManager.updateItem(itemId, { 
      readProgress: Math.max(0, Math.min(100, progress)),
      lastRead: new Date().toISOString()
    });
  },

  // Toggle favorite status
  toggleFavorite: (itemId) => {
    try {
      const item = StorageManager.getItem(itemId);
      if (item) {
        return StorageManager.updateItem(itemId, { 
          isFavorite: !item.isFavorite 
        });
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  },

  // Add tags to an item
  addTag: (itemId, tag) => {
    try {
      const item = StorageManager.getItem(itemId);
      if (item) {
        const tags = item.tags || [];
        if (!tags.includes(tag)) {
          tags.push(tag);
          return StorageManager.updateItem(itemId, { tags });
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to add tag:', error);
      return false;
    }
  },

  // Remove tag from an item
  removeTag: (itemId, tag) => {
    try {
      const item = StorageManager.getItem(itemId);
      if (item) {
        const tags = (item.tags || []).filter(t => t !== tag);
        return StorageManager.updateItem(itemId, { tags });
      }
      return false;
    } catch (error) {
      console.error('Failed to remove tag:', error);
      return false;
    }
  },

  // Get storage statistics
  getStats: () => {
    try {
      const items = StorageManager.getAllItems();
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
  exportData: () => {
    try {
      const items = StorageManager.getAllItems();
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
  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.items && Array.isArray(data.items)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  // Clear all data
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
};