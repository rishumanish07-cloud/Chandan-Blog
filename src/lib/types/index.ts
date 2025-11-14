import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  accountType?: 'public' | 'private';
  followers?: string[];
  following?: string[];
  followRequests?: string[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  createdAt: Timestamp;
  likes: string[];
  dislikes: string[];
  authorAccountType?: 'public' | 'private';
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  type: 'like' | 'comment' | 'follow_request';
  postId?: string;
  postTitle?: string;
  commentText?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
