import { Message } from "../gemini/GeminiFunctions";

export interface QueryHistoryItem {
  id: string;
  userId: string;
  question: string;
  selectedPerspective: string | null;
  perspectives: {
    name: string;
    advice: string;
  }[];
  conversation: Message[];
  context?: Record<string, string>;
  createdAt: string;
}

// Save a new query to history
export const saveQueryHistory = (
  userId: string,
  question: string,
  perspectives: any[],
  selectedPerspective: string | null = null,
  conversation: Message[] = [],
  context: Record<string, string> = {}
): string => {
  // Get existing history
  const historyStr = localStorage.getItem('queryHistory') || '[]';
  let history: QueryHistoryItem[] = [];
  
  try {
    history = JSON.parse(historyStr);
  } catch (err) {
    console.error('Failed to parse query history', err);
  }
  
  // Create new item
  const id = 'query_' + Date.now();
  const newItem: QueryHistoryItem = {
    id,
    userId,
    question,
    selectedPerspective,
    perspectives,
    conversation,
    context, 
    createdAt: new Date().toISOString()
  };
  
  // Add to history
  history.unshift(newItem); // Add to beginning of array
  
  // Limit to last 20 items
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  
  // Save to localStorage
  localStorage.setItem('queryHistory', JSON.stringify(history));
  
  return id;
};

// Update an existing query with conversation
export const updateQueryConversation = (
  queryId: string,
  selectedPerspective: string,
  conversation: Message[],
  context?: Record<string, string>
): boolean => {
  // Get existing history
  const historyStr = localStorage.getItem('queryHistory') || '[]';
  let history: QueryHistoryItem[] = [];
  
  try {
    history = JSON.parse(historyStr);
  } catch (err) {
    console.error('Failed to parse query history', err);
    return false;
  }
  
  // Find and update item
  const index = history.findIndex(item => item.id === queryId);
  
  if (index === -1) {
    return false;
  }
  
  // Update the item
  history[index].selectedPerspective = selectedPerspective;
  history[index].conversation = conversation;
  // Update context if provided
  if (context) {
    history[index].context = { 
      ...(history[index].context || {}), 
      ...context 
    };
  }
  // Save to localStorage
  localStorage.setItem('queryHistory', JSON.stringify(history));
  
  return true;
};

// Get user's query history
export const getUserQueryHistory = (userId: string): QueryHistoryItem[] => {
  // Get existing history
  const historyStr = localStorage.getItem('queryHistory') || '[]';
  let history: QueryHistoryItem[] = [];
  
  try {
    history = JSON.parse(historyStr);
  } catch (err) {
    console.error('Failed to parse query history', err);
    return [];
  }
  
  // Filter by userId
  return history.filter(item => item.userId === userId);
}; 

// update just the context of a query
export const updateQueryContext = (
  queryId: string,
  context: Record<string, string>
): boolean => {
  // Get existing history
  const historyStr = localStorage.getItem('queryHistory') || '[]';
  let history: QueryHistoryItem[] = [];
  
  try {
    history = JSON.parse(historyStr);
  } catch (err) {
    console.error('Failed to parse query history', err);
    return false;
  }
  
  // Find and update item
  const index = history.findIndex(item => item.id === queryId);
  
  if (index === -1) {
    return false;
  }
  
  // Update just the context
  history[index].context = {
    ...(history[index].context || {}),
    ...context
  };
  
  // Save to localStorage
  localStorage.setItem('queryHistory', JSON.stringify(history));
  
  return true;
};