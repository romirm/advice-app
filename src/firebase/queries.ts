import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";
import { QueryHistory } from "./types";
import { Message } from "../gemini/GeminiFunctions";
import { AdviceResponse } from "../pages/Home";

// Save a new query to history
export const saveQueryHistory = async (
  userId: string,
  question: string,
  perspectives: AdviceResponse["perspectives"],
  selectedPerspective: string | null = null,
  conversation: Message[] = []
) => {
  try {
    const docRef = await addDoc(collection(db, "queryHistory"), {
      userId,
      question,
      perspectives,
      selectedPerspective,
      conversation,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id };
  } catch (error) {
    console.error("Error saving query history:", error);
    return { error };
  }
};

// Update an existing query with conversation
export const updateQueryConversation = async (
  queryId: string,
  selectedPerspective: string,
  conversation: Message[]
) => {
  try {
    await addDoc(collection(db, `queryHistory/${queryId}/conversations`), {
      selectedPerspective,
      conversation,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating query conversation:", error);
    return { error };
  }
};

// Get user's query history
export const getUserQueryHistory = async (userId: string, maxResults = 10): Promise<QueryHistory[]> => {
  try {
    const q = query(
      collection(db, "queryHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(q);
    const history: QueryHistory[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        question: data.question,
        selectedPerspective: data.selectedPerspective,
        perspectives: data.perspectives,
        conversation: data.conversation,
        createdAt: (data.createdAt as Timestamp).toDate()
      });
    });
    
    return history;
  } catch (error) {
    console.error("Error getting query history:", error);
    return [];
  }
};

// Get a specific query by ID
export const getQueryById = async (queryId: string): Promise<QueryHistory | null> => {
  try {
    const docRef = doc(db, "queryHistory", queryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        question: data.question,
        selectedPerspective: data.selectedPerspective,
        perspectives: data.perspectives,
        conversation: data.conversation,
        createdAt: (data.createdAt as Timestamp).toDate()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting query by ID:", error);
    return null;
  }
}; 