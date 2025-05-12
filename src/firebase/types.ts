export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile extends User {
  createdAt: Date;
  lastLogin: Date;
}

export interface QueryHistory {
  id: string;
  userId: string;
  question: string;
  selectedPerspective: string | null;
  perspectives: {
    name: string;
    advice: string;
  }[];
  conversation: {
    role: "user" | "ai";
    content: string;
  }[];
  createdAt: Date;
} 