"use server";

import { collection, addDoc, Timestamp, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Notification } from "@/lib/types";

type CreateNotificationPayload = Omit<Notification, 'id' | 'createdAt' | 'isRead'>;

export async function createNotification(payload: CreateNotificationPayload) {
  if (payload.recipientId === payload.senderId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      ...payload,
      isRead: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function markNotificationsAsRead(userId: string) {
    if (!userId) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("recipientId", "==", userId), where("isRead", "==", false));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw new Error("Could not update notifications.");
    }
}
