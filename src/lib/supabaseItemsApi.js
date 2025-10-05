import { supabase } from './supabaseClient';

// === SAVED ITEMS CRUD OPERATIONS ===

export async function saveItem(userId, item) {
  const { data, error } = await supabase
    .from('saved_items')
    .upsert({
      id: item.id,
      user_id: userId,
      url: item.url,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      thumbnail: item.thumbnail,
      type: item.type || 'Article',
      reading_time: item.readingTime,
      word_count: item.wordCount,
      read_progress: item.readProgress || 0,
      is_read: item.isRead || false,
      is_favorite: item.isFavorite || false,
      is_archived: item.isArchived || false,
      tags: item.tags || [],
      notes: item.notes || '',
      last_read: item.lastRead,
      created_at: item.createdAt || new Date().toISOString(),
    }, { 
      onConflict: 'id',
      returning: 'minimal' 
    });
  
  if (error) throw error;
  return data;
}

export async function getAllItems(userId) {
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Transform to match local storage format
  return data?.map(item => ({
    id: item.id,
    url: item.url,
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    thumbnail: item.thumbnail,
    type: item.type,
    readingTime: item.reading_time,
    wordCount: item.word_count,
    readProgress: item.read_progress,
    isRead: item.is_read,
    isFavorite: item.is_favorite,
    isArchived: item.is_archived,
    tags: item.tags,
    notes: item.notes,
    lastRead: item.last_read,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  })) || [];
}

export async function getItem(userId, itemId) {
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  
  // Transform to match local storage format
  return {
    id: data.id,
    url: data.url,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    thumbnail: data.thumbnail,
    type: data.type,
    readingTime: data.reading_time,
    wordCount: data.word_count,
    readProgress: data.read_progress,
    isRead: data.is_read,
    isFavorite: data.is_favorite,
    isArchived: data.is_archived,
    tags: data.tags,
    notes: data.notes,
    lastRead: data.last_read,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateItem(userId, itemId, updates) {
  // Transform updates to match database column names
  const dbUpdates = {};
  if (updates.readProgress !== undefined) dbUpdates.read_progress = updates.readProgress;
  if (updates.isRead !== undefined) dbUpdates.is_read = updates.isRead;
  if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.lastRead !== undefined) dbUpdates.last_read = updates.lastRead;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.excerpt !== undefined) dbUpdates.excerpt = updates.excerpt;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  
  const { data, error } = await supabase
    .from('saved_items')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('id', itemId);
  
  if (error) throw error;
  return data;
}

export async function deleteItem(userId, itemId) {
  const { data, error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', userId)
    .eq('id', itemId);
  
  if (error) throw error;
  return data;
}

// === CONVENIENCE FUNCTIONS ===

export async function toggleFavorite(userId, itemId) {
  const item = await getItem(userId, itemId);
  if (!item) return false;
  
  return await updateItem(userId, itemId, {
    isFavorite: !item.isFavorite
  });
}

export async function toggleArchive(userId, itemId) {
  const item = await getItem(userId, itemId);
  if (!item) return false;
  
  return await updateItem(userId, itemId, {
    isArchived: !item.isArchived
  });
}

export async function markAsRead(userId, itemId) {
  return await updateItem(userId, itemId, {
    readProgress: 100,
    isRead: true,
    lastRead: new Date().toISOString()
  });
}

export async function markAsUnread(userId, itemId) {
  return await updateItem(userId, itemId, {
    readProgress: 0,
    isRead: false
  });
}

export async function updateProgress(userId, itemId, progress) {
  return await updateItem(userId, itemId, {
    readProgress: Math.max(0, Math.min(100, progress)),
    isRead: progress >= 90,
    lastRead: new Date().toISOString()
  });
}

export async function addTag(userId, itemId, tag) {
  const item = await getItem(userId, itemId);
  if (!item) return false;
  
  const tags = item.tags || [];
  if (!tags.includes(tag)) {
    return await updateItem(userId, itemId, {
      tags: [...tags, tag]
    });
  }
  return true;
}

export async function removeTag(userId, itemId, tag) {
  const item = await getItem(userId, itemId);
  if (!item) return false;
  
  const tags = item.tags || [];
  return await updateItem(userId, itemId, {
    tags: tags.filter(t => t !== tag)
  });
}

// === FILTERED QUERIES ===

export async function getFavoriteItems(userId) {
  const { data, error } = await supabase
    .from('favorite_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getArchivedItems(userId) {
  const { data, error } = await supabase
    .from('archived_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getUnreadItems(userId) {
  const { data, error } = await supabase
    .from('unread_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// === SEARCH ===

export async function searchItems(userId, query) {
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .textSearch('search_vector', query)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// === STATS ===

export async function getStats(userId) {
  const { data, error } = await supabase
    .rpc('get_user_stats', { user_id: userId });
  
  if (error) {
    // Fallback to manual calculation
    const items = await getAllItems(userId);
    return {
      totalItems: items.length,
      articles: items.filter(item => item.type !== 'PDF').length,
      pdfs: items.filter(item => item.type === 'PDF').length,
      favorites: items.filter(item => item.isFavorite).length,
      readItems: items.filter(item => item.isRead).length,
      archived: items.filter(item => item.isArchived).length
    };
  }
  
  return data;
}