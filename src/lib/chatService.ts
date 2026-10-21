import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { ChatConversation, ChatMessage } from "../types";

const CONVERSATIONS_STORAGE_PREFIX = "skyring-conversations-";
const MESSAGES_STORAGE_PREFIX = "skyring-chat-";

export const FAKE_USERNAMES = [
  "sophie_nomad",
  "marco_rossi",
  "elena_voyage",
  "alex_explorer",
];

export function isFakeUser(username?: string, uid?: string): boolean {
  if (!username && !uid) return false;
  if (uid && uid.startsWith("curated-")) return true;
  const cleanU = (username || "").trim().toLowerCase().replace(/^@/, "");
  if (FAKE_USERNAMES.includes(cleanU)) return true;
  return false;
}

// Generate deterministic conversation ID for two users
export function getDirectChatId(userA: string, userB: string): string {
  const normA = userA.trim().toLowerCase().replace(/^@/, "");
  const normB = userB.trim().toLowerCase().replace(/^@/, "");
  return [normA, normB].sort().join("__");
}

// Get all conversations for current user - filtering out any fake / curated accounts
export function getStoredConversations(currentUser: {
  uid: string;
  username: string;
  avatar?: string;
}): ChatConversation[] {
  const userKey = currentUser.uid || currentUser.username || "guest";
  try {
    const raw = window.localStorage.getItem(
      `${CONVERSATIONS_STORAGE_PREFIX}${userKey}`,
    );
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ChatConversation[];
    if (!Array.isArray(parsed)) return [];

    // Filter out any fake/curated conversations
    const cleaned = parsed.filter((c) => {
      const otherFake = isFakeUser(c.otherUser?.username, c.otherUser?.uid);
      const participantFake = c.participantUsernames?.some((u) =>
        FAKE_USERNAMES.includes(u.toLowerCase().replace(/^@/, "")),
      );
      const idFake = c.participantIds?.some((id) => id.startsWith("curated-"));
      const chatIdFake = FAKE_USERNAMES.some((fake) =>
        c.id.toLowerCase().includes(fake),
      );
      if (otherFake || participantFake || idFake || chatIdFake) {
        try {
          window.localStorage.removeItem(`${MESSAGES_STORAGE_PREFIX}${c.id}`);
        } catch {}
        return false;
      }
      return true;
    });

    if (cleaned.length !== parsed.length) {
      saveStoredConversations(currentUser, cleaned);
    }
    return cleaned;
  } catch {
    return [];
  }
}

// Save conversations list
export function saveStoredConversations(
  currentUser: { uid: string; username: string },
  convs: ChatConversation[],
): void {
  const userKey = currentUser.uid || currentUser.username || "guest";
  const cleaned = convs.filter((c) => {
    const otherFake = isFakeUser(c.otherUser?.username, c.otherUser?.uid);
    const participantFake = c.participantUsernames?.some((u) =>
      FAKE_USERNAMES.includes(u.toLowerCase().replace(/^@/, "")),
    );
    const idFake = c.participantIds?.some((id) => id.startsWith("curated-"));
    const chatIdFake = FAKE_USERNAMES.some((fake) =>
      c.id.toLowerCase().includes(fake),
    );
    return !otherFake && !participantFake && !idFake && !chatIdFake;
  });

  try {
    window.localStorage.setItem(
      `${CONVERSATIONS_STORAGE_PREFIX}${userKey}`,
      JSON.stringify(cleaned),
    );
  } catch {
    // ignore
  }
}

// Get messages for a given chat
export function getStoredMessages(
  chatId: string,
  _currentUser: { username: string },
): ChatMessage[] {
  if (FAKE_USERNAMES.some((fake) => chatId.toLowerCase().includes(fake))) {
    try {
      window.localStorage.removeItem(`${MESSAGES_STORAGE_PREFIX}${chatId}`);
    } catch {}
    return [];
  }
  try {
    const raw = window.localStorage.getItem(`${MESSAGES_STORAGE_PREFIX}${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (m) =>
        !isFakeUser(m.senderUsername, m.senderId) &&
        !m.id.startsWith("msg-sophie") &&
        !m.id.startsWith("msg-marco") &&
        !m.id.startsWith("msg-elena"),
    );
  } catch {
    return [];
  }
}

// Save messages for a given chat
export function saveStoredMessages(chatId: string, msgs: ChatMessage[]): void {
  if (FAKE_USERNAMES.some((fake) => chatId.toLowerCase().includes(fake))) return;
  try {
    window.localStorage.setItem(
      `${MESSAGES_STORAGE_PREFIX}${chatId}`,
      JSON.stringify(msgs),
    );
  } catch {
    // ignore
  }
}

// Edit a message text
export function editChatMessage(
  chatId: string,
  messageId: string,
  newText: string,
  currentUser: { username: string }
): ChatMessage[] {
  const currentMsgs = getStoredMessages(chatId, currentUser);
  const updated = currentMsgs.map((m) =>
    m.id === messageId ? { ...m, text: newText.trim(), isEdited: true } : m
  );
  saveStoredMessages(chatId, updated);

  try {
    const rawConvs = window.localStorage.getItem(`${CONVERSATIONS_STORAGE_PREFIX}${currentUser.username}`);
    if (rawConvs) {
      const convs = JSON.parse(rawConvs) as ChatConversation[];
      const updatedConvs = convs.map((c) => {
        if (c.id === chatId && c.lastMessage) {
          const lastMsg = updated[updated.length - 1];
          if (lastMsg) {
            return {
              ...c,
              lastMessage: {
                text: lastMsg.text,
                senderUsername: lastMsg.senderUsername,
                createdAt: lastMsg.createdAt,
              },
            };
          }
        }
        return c;
      });
      window.localStorage.setItem(
        `${CONVERSATIONS_STORAGE_PREFIX}${currentUser.username}`,
        JSON.stringify(updatedConvs)
      );
    }
  } catch {}

  return updated;
}

// Delete a message
export function deleteChatMessage(
  chatId: string,
  messageId: string,
  currentUser: { username: string }
): ChatMessage[] {
  const currentMsgs = getStoredMessages(chatId, currentUser);
  const updated = currentMsgs.filter((m) => m.id !== messageId);
  saveStoredMessages(chatId, updated);

  try {
    const rawConvs = window.localStorage.getItem(`${CONVERSATIONS_STORAGE_PREFIX}${currentUser.username}`);
    if (rawConvs) {
      const convs = JSON.parse(rawConvs) as ChatConversation[];
      const updatedConvs = convs.map((c) => {
        if (c.id === chatId) {
          const lastMsg = updated[updated.length - 1];
          return {
            ...c,
            lastMessage: lastMsg
              ? {
                  text: lastMsg.text,
                  senderUsername: lastMsg.senderUsername,
                  createdAt: lastMsg.createdAt,
                }
              : undefined,
          };
        }
        return c;
      });
      window.localStorage.setItem(
        `${CONVERSATIONS_STORAGE_PREFIX}${currentUser.username}`,
        JSON.stringify(updatedConvs)
      );
    }
  } catch {}

  return updated;
}

// Send a chat message
export async function sendChatMessage({
  chatId,
  senderId,
  senderUsername,
  senderAvatar,
  text,
  replyToStory,
  otherUser,
  _onReceivedReply,
}: {
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  text: string;
  replyToStory?: {
    storyId: string;
    mediaUrl: string;
    caption?: string;
  };
  otherUser: {
    uid: string;
    username: string;
    avatar?: string;
    location?: string;
  };
  _onReceivedReply?: (reply: ChatMessage) => void;
}): Promise<ChatMessage> {
  void _onReceivedReply;
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    chatId,
    senderId,
    senderUsername,
    replyToStory,
    senderAvatar,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    isRead: false,
    ...(replyToStory ? { replyToStory } : {}),
  };

  // 1. Save locally in messages array
  const currentMsgs = getStoredMessages(chatId, { username: senderUsername });
  saveStoredMessages(chatId, [...currentMsgs, newMsg]);

  // 2. Update conversation list locally
  const currentConvs = getStoredConversations({
    uid: senderId,
    username: senderUsername,
  });
  const existingIdx = currentConvs.findIndex((c) => c.id === chatId);

  const updatedConv: ChatConversation = {
    id: chatId,
    participantIds: [senderId, otherUser.uid],
    participantUsernames: [senderUsername, otherUser.username],
    otherUser,
    lastMessage: {
      text: newMsg.text,
      senderUsername: newMsg.senderUsername,
      createdAt: newMsg.createdAt,
    },
    unreadCount: 0,
    updatedAt: newMsg.createdAt,
  };

  let newConvs: ChatConversation[];
  if (existingIdx >= 0) {
    newConvs = [...currentConvs];
    newConvs[existingIdx] = updatedConv;
  } else {
    newConvs = [updatedConv, ...currentConvs];
  }

  // Sort by latest message
  newConvs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  saveStoredConversations(
    { uid: senderId, username: senderUsername },
    newConvs,
  );

  // 3. Firestore sync if authenticated
  if (senderId && senderId !== "guest" && senderId !== "me") {
    try {
      const msgRef = doc(db, "chats", chatId, "messages", newMsg.id);
      await setDoc(msgRef, newMsg);
      const chatDocRef = doc(db, "chats", chatId);
      await setDoc(
        chatDocRef,
        {
          id: chatId,
          participants: [senderId, otherUser.uid],
          lastMessage: updatedConv.lastMessage,
          updatedAt: updatedConv.updatedAt,
        },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not sync chat to Firestore:", err);
    }
  }

  return newMsg;
}

// Mark a conversation as read
export function markConversationAsRead(
  chatId: string,
  currentUser: { uid: string; username: string },
): void {
  const convs = getStoredConversations(currentUser);
  const idx = convs.findIndex((c) => c.id === chatId);
  if (idx >= 0 && convs[idx].unreadCount > 0) {
    convs[idx].unreadCount = 0;
    saveStoredConversations(currentUser, convs);
  }

  const msgs = getStoredMessages(chatId, currentUser);
  let changed = false;
  msgs.forEach((m) => {
    if (!m.isRead) {
      m.isRead = true;
      changed = true;
    }
  });
  if (changed) {
    saveStoredMessages(chatId, msgs);
  }
}

// Count total unread messages for nav badge
export function getTotalUnreadCount(currentUser: {
  uid: string;
  username: string;
}): number {
  const convs = getStoredConversations(currentUser);
  return convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}

// Start or retrieve a chat with any traveler
export function getOrCreateChatWithUser({
  currentUser,
  targetUser,
}: {
  currentUser: { uid: string; username: string; avatar?: string };
  targetUser: {
    uid: string;
    username: string;
    avatar?: string;
    location?: string;
  };
}): { chatId: string; conversation: ChatConversation } {
  const chatId = getDirectChatId(currentUser.username, targetUser.username);
  const convs = getStoredConversations(currentUser);
  const existing = convs.find((c) => c.id === chatId);

  if (existing) {
    return { chatId, conversation: existing };
  }

  const newConv: ChatConversation = {
    id: chatId,
    participantIds: [currentUser.uid, targetUser.uid],
    participantUsernames: [currentUser.username, targetUser.username],
    otherUser: {
      uid: targetUser.uid,
      username: targetUser.username,
      avatar: targetUser.avatar,
      location: targetUser.location,
      isOnline: true,
    },
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  };

  const updatedConvs = [newConv, ...convs];
  saveStoredConversations(currentUser, updatedConvs);

  return { chatId, conversation: newConv };
}
