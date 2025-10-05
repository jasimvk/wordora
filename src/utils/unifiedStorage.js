import { StorageManager as LocalStorage } from './storage';
import * as SupabaseAPI from '../lib/supabaseItemsApi';

// Unified storage manager that handles both local storage and Supabase sync
export class UnifiedStorageManager {
  constructor(user = null) {
    this.user = user;
    this.useSupabase = !!user;
  }

  // Get all saved items
  async getAllItems() {
    try {
      if (this.useSupabase) {
        return await SupabaseAPI.getAllItems(this.user.id);
      } else {
        return LocalStorage.getAllItems(this.user?.id);
      }
    } catch (error) {
      console.error('Failed to get all items:', error);
      // Fallback to local storage
      return LocalStorage.getAllItems(this.user?.id);
    }
  }

  // Save a new item
  async saveItem(item) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.saveItem(this.user.id, item);
        // Also save locally for offline access
        LocalStorage.saveItem(item, this.user.id);
        return true;
      } else {
        return LocalStorage.saveItem(item, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      // Fallback to local storage only
      return LocalStorage.saveItem(item, this.user?.id);
    }
  }

  // Update an existing item
  async updateItem(itemId, updates) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.updateItem(this.user.id, itemId, updates);
        // Also update locally
        LocalStorage.updateItem(itemId, updates, this.user.id);
        return true;
      } else {
        return LocalStorage.updateItem(itemId, updates, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      // Fallback to local storage only
      return LocalStorage.updateItem(itemId, updates, this.user?.id);
    }
  }

  // Delete an item
  async deleteItem(itemId) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.deleteItem(this.user.id, itemId);
        // Also delete locally
        LocalStorage.deleteItem(itemId, this.user.id);
        return true;
      } else {
        return LocalStorage.deleteItem(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      // Fallback to local storage only
      return LocalStorage.deleteItem(itemId, this.user?.id);
    }
  }

  // Get a single item
  async getItem(itemId) {
    try {
      if (this.useSupabase) {
        return await SupabaseAPI.getItem(this.user.id, itemId);
      } else {
        return LocalStorage.getItem(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to get item:', error);
      // Fallback to local storage
      return LocalStorage.getItem(itemId, this.user?.id);
    }
  }

  // Update reading progress
  async updateProgress(itemId, progress) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.updateProgress(this.user.id, itemId, progress);
        // Also update locally
        LocalStorage.updateProgress(itemId, progress, this.user.id);
        return true;
      } else {
        return LocalStorage.updateProgress(itemId, progress, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      return LocalStorage.updateProgress(itemId, progress, this.user?.id);
    }
  }

  // Toggle favorite status
  async toggleFavorite(itemId) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.toggleFavorite(this.user.id, itemId);
        // Also update locally
        LocalStorage.toggleFavorite(itemId, this.user.id);
        return true;
      } else {
        return LocalStorage.toggleFavorite(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return LocalStorage.toggleFavorite(itemId, this.user?.id);
    }
  }

  // Toggle archive status
  async toggleArchive(itemId) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.toggleArchive(this.user.id, itemId);
        // Also update locally
        LocalStorage.toggleArchive(itemId, this.user.id);
        return true;
      } else {
        return LocalStorage.toggleArchive(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      return LocalStorage.toggleArchive(itemId, this.user?.id);
    }
  }

  // Mark as read
  async markAsRead(itemId) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.markAsRead(this.user.id, itemId);
        // Also update locally
        LocalStorage.markAsRead(itemId, this.user.id);
        return true;
      } else {
        return LocalStorage.markAsRead(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return LocalStorage.markAsRead(itemId, this.user?.id);
    }
  }

  // Mark as unread
  async markAsUnread(itemId) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.markAsUnread(this.user.id, itemId);
        // Also update locally
        LocalStorage.markAsUnread(itemId, this.user.id);
        return true;
      } else {
        return LocalStorage.markAsUnread(itemId, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to mark as unread:', error);
      return LocalStorage.markAsUnread(itemId, this.user?.id);
    }
  }

  // Add tag
  async addTag(itemId, tag) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.addTag(this.user.id, itemId, tag);
        // Also update locally
        LocalStorage.addTag(itemId, tag, this.user.id);
        return true;
      } else {
        return LocalStorage.addTag(itemId, tag, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
      return LocalStorage.addTag(itemId, tag, this.user?.id);
    }
  }

  // Remove tag
  async removeTag(itemId, tag) {
    try {
      if (this.useSupabase) {
        await SupabaseAPI.removeTag(this.user.id, itemId, tag);
        // Also update locally
        LocalStorage.removeTag(itemId, tag, this.user.id);
        return true;
      } else {
        return LocalStorage.removeTag(itemId, tag, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
      return LocalStorage.removeTag(itemId, tag, this.user?.id);
    }
  }

  // Get stats
  async getStats() {
    try {
      if (this.useSupabase) {
        return await SupabaseAPI.getStats(this.user.id);
      } else {
        return LocalStorage.getStats(this.user?.id);
      }
    } catch (error) {
      console.error('Failed to get stats:', error);
      return LocalStorage.getStats(this.user?.id);
    }
  }

  // Sync local storage to Supabase (for migration when user signs in)
  async syncToSupabase() {
    if (!this.useSupabase) return false;

    try {
      const localItems = LocalStorage.getAllItems('anonymous');
      if (localItems.length === 0) return true;

      console.log(`Syncing ${localItems.length} local items to Supabase...`);
      
      for (const item of localItems) {
        try {
          // Check if item already exists in Supabase
          const existingItem = await SupabaseAPI.getItem(this.user.id, item.id);
          if (!existingItem) {
            await SupabaseAPI.saveItem(this.user.id, item);
          }
        } catch (itemError) {
          console.error('Failed to sync item:', item.id, itemError);
        }
      }

      // Clear local anonymous data after successful sync
      LocalStorage.clearAll('anonymous');
      console.log('Local items synced successfully');
      return true;
    } catch (error) {
      console.error('Failed to sync to Supabase:', error);
      return false;
    }
  }

  // Export data
  async exportData() {
    try {
      if (this.useSupabase) {
        const items = await SupabaseAPI.getAllItems(this.user.id);
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          items: items
        };
        return JSON.stringify(exportData, null, 2);
      } else {
        return LocalStorage.exportData(this.user?.id);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      return LocalStorage.exportData(this.user?.id);
    }
  }

  // Import data
  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid data format');
      }

      if (this.useSupabase) {
        // Import to Supabase
        for (const item of data.items) {
          await this.saveItem(item);
        }
        return true;
      } else {
        return LocalStorage.importData(jsonData, this.user?.id);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Clear all data
  async clearAll() {
    try {
      if (this.useSupabase) {
        const items = await SupabaseAPI.getAllItems(this.user.id);
        for (const item of items) {
          await SupabaseAPI.deleteItem(this.user.id, item.id);
        }
        // Also clear local data
        LocalStorage.clearAll(this.user.id);
        return true;
      } else {
        return LocalStorage.clearAll(this.user?.id);
      }
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return LocalStorage.clearAll(this.user?.id);
    }
  }
}