
"use server";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";

export async function getOrCreateChat(
  currentUserId: string,
  targetUserId: string
): Promise<string> {
  if (currentUserId === targetUserId) {
    throw new Error("Cannot create chat with yourself.");
  }
  const members = [currentUserId, targetUserId].sort();
  const chatId = members.join("_");
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);
    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef),
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error("User not found.");
    }
    const currentUser = currentUserSnap.data() as UserProfile;
    const targetUser = targetUserSnap.data() as UserProfile;

    await setDoc(chatRef, {
      id: chatId,
      members,
      memberInfo: {
        [currentUserId]: {
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        },
        [targetUserId]: {
          displayName: targetUser.displayName,
          photoURL: targetUser.photoURL,
        },
      },
    });
  }

  return chatId;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  if (!text.trim()) {
    throw new Error("Message text cannot be empty.");
  }

  const messagesCol = collection(db, "chats", chatId, "messages");
  const senderRef = doc(db, "users", senderId);
  const senderSnap = await getDoc(senderRef);

  if (!senderSnap.exists()) {
    throw new Error("Sender not found.");
  }

  const sender = senderSnap.data() as UserProfile;

  await addDoc(messagesCol, {
    text,
    senderId,
    senderName: sender.displayName,
    senderPhotoURL: sender.photoURL,
    createdAt: serverTimestamp(),
  });

  // Update last message on chat document
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      text,
      senderId,
      createdAt: serverTimestamp(),
    },
  });
}
