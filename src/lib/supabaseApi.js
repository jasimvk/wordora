import { supabase } from './supabaseClient';

// Helper functions for common reader persistence actions: progress, highlights, bookmarks

export async function upsertProgress(userId, itemId, progress) {
  const { data, error } = await supabase
    .from('reader_progress')
    .upsert({ user_id: userId, item_id: itemId, progress }, { onConflict: ['user_id', 'item_id'] });
  if (error) throw error;
  return data;
}

export async function getProgress(userId, itemId) {
  const { data, error } = await supabase
    .from('reader_progress')
    .select('progress')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // ignore not found
  return data?.progress || 0;
}

export async function saveHighlight(userId, itemId, highlight) {
  const { data, error } = await supabase
    .from('highlights')
    .insert([{ user_id: userId, item_id: itemId, text: highlight.text, position: highlight.position }]);
  if (error) throw error;
  return data;
}

export async function getHighlights(userId, itemId) {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId);
  if (error) throw error;
  return data || [];
}

export async function addBookmark(userId, itemId, position) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{ user_id: userId, item_id: itemId, position }]);
  if (error) throw error;
  return data;
}

export async function getBookmarks(userId, itemId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId);
  if (error) throw error;
  return data || [];
}
