import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { ChatConversation, ChatMessage } from "../types";

const CONVERSATIONS_STORAGE_PREFIX = "skyring-conversations-";
const MESSAGES_STORAGE_PREFIX = "skyring-chat-";

// Generate deterministic conversation ID for two users
export function getDirectChatId(userA: string, userB: string): string {
  const normA = userA.trim().toLowerCase().replace(/^@/, "");
  const normB = userB.trim().toLowerCase().replace(/^@/, "");
  return [normA, normB].sort().join("__");
}

// Initial starter conversations for community travelers so users have an engaging experience immediately
function getInitialCuratedConversations(currentUser: {
  uid: string;
  username: string;
  avatar?: string;
}): ChatConversation[] {
  const now = Date.now();
  return [
    {
      id: getDirectChatId(currentUser.username, "sophie_nomad"),
      participantIds: [currentUser.uid, "curated-sophie"],
      participantUsernames: [currentUser.username, "sophie_nomad"],
      otherUser: {
        uid: "curated-sophie",
        username: "sophie_nomad",
        avatar: "S",
        location: "Париж, Франция",
        isOnline: true,
      },
      lastMessage: {
        text: "Привет! Рада знакомству! Если планируешь поездку в Амальфи или Киото — с радостью поделюсь маршрутами ☕️🌿",
        senderUsername: "sophie_nomad",
        createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
      },
      unreadCount: 1,
      updatedAt: new Date(now - 25 * 60 * 1000).toISOString(),
    },
    {
      id: getDirectChatId(currentUser.username, "marco_rossi"),
      participantIds: [currentUser.uid, "curated-marco"],
      participantUsernames: [currentUser.username, "marco_rossi"],
      otherUser: {
        uid: "curated-marco",
        username: "marco_rossi",
        avatar: "M",
        location: "Рим, Италия",
        isOnline: false,
      },
      lastMessage: {
        text: "Ciao! Отличные отметки на карте. Если будешь в Риме, покажу пару скрытых двориков Трастевере! 🏛️",
        senderUsername: "marco_rossi",
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
      unreadCount: 0,
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: getDirectChatId(currentUser.username, "elena_voyage"),
      participantIds: [currentUser.uid, "curated-elena"],
      participantUsernames: [currentUser.username, "elena_voyage"],
      otherUser: {
        uid: "curated-elena",
        username: "elena_voyage",
        avatar: "E",
        location: "Алматы, Казахстан",
        isOnline: true,
      },
      lastMessage: {
        text: "Привет! Собираешься в горы в этом сезоне? Могу подсказать проверенные кемпинги 🏔️✨",
        senderUsername: "elena_voyage",
        createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
      },
      unreadCount: 0,
      updatedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// Initial starter messages for each curated chat
function getInitialStarterMessages(
  chatId: string,
  _currentUser?: { username: string },
): ChatMessage[] {
  const now = Date.now();
  if (chatId.includes("sophie_nomad")) {
    return [
      {
        id: "msg-sophie-1",
        chatId,
        senderId: "curated-sophie",
        senderUsername: "sophie_nomad",
        senderAvatar: "S",
        text: "Привет! Рада знакомству! Если планируешь поездку в Амальфи или Киото — с радостью поделюсь маршрутами ☕️🌿",
        createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
        isRead: false,
      },
    ];
  }
  if (chatId.includes("marco_rossi")) {
    return [
      {
        id: "msg-marco-1",
        chatId,
        senderId: "curated-marco",
        senderUsername: "marco_rossi",
        senderAvatar: "M",
        text: "Ciao! Отличные отметки на карте. Если будешь в Риме, покажу пару скрытых двориков Трастевере! 🏛️",
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
    ];
  }
  if (chatId.includes("elena_voyage")) {
    return [
      {
        id: "msg-elena-1",
        chatId,
        senderId: "curated-elena",
        senderUsername: "elena_voyage",
        senderAvatar: "E",
        text: "Привет! Собираешься в горы в этом сезоне? Могу подсказать проверенные кемпинги 🏔️✨",
        createdAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
    ];
  }
  return [];
}

// Smart simulated replies from curated travelers to make chatting feel real and alive
const CURATED_REPLIES: Record<string, string[]> = {
  sophie_nomad: [
    "Звучит потрясающе! Обязательно добавь это место в свой список путешествий 📸",
    "Полностью согласна! Утренний свет там просто невероятный, особенно на рассвете.",
    "Спасибо за сообщение! С удовольствием посмотрю твои новые посты в ленте 🌿",
    "Кстати, очень рекомендую заглянуть в небольшие местные кафе на улочках — там лучший кофе!",
  ],
  marco_rossi: [
    "Отличная идея! Архитектура там завораживает в любое время суток 🏛️",
    "Grazie! Если понадобятся точные координаты смотровых площадок — только скажи!",
    "Именно так путешествия и открывают для нас мир!",
  ],
  elena_voyage: [
    "Класс! Горы никогда не перестают удивлять. Главное — удобная обувь и термос с чаем ⛰️",
    "Обязательно отправляйся туда! Впечатления останутся на всю жизнь 🌌",
    "Супер! Держи меня в курсе, как пройдет поездка!",
  ],
  alex_explorer: [
    "Привет! Маршрут отличный, проверено на себе 🌲",
    "Там потрясающий воздух и чистейшие озера, удачи в походе!",
  ],
};

// Get all conversations for current user
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
      const initial = getInitialCuratedConversations(currentUser);
      saveStoredConversations(currentUser, initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as ChatConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return getInitialCuratedConversations(currentUser);
  }
}

// Save conversations list
export function saveStoredConversations(
  currentUser: { uid: string; username: string },
  convs: ChatConversation[],
): void {
  const userKey = currentUser.uid || currentUser.username || "guest";
  try {
    window.localStorage.setItem(
      `${CONVERSATIONS_STORAGE_PREFIX}${userKey}`,
      JSON.stringify(convs),
    );
  } catch {
    // ignore
  }
}

// Get messages for a given chat
export function getStoredMessages(
  chatId: string,
  currentUser: { username: string },
): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(`${MESSAGES_STORAGE_PREFIX}${chatId}`);
    if (!raw) {
      const initial = getInitialStarterMessages(chatId, currentUser);
      if (initial.length > 0) {
        saveStoredMessages(chatId, initial);
      }
      return initial;
    }
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save messages for a given chat
export function saveStoredMessages(chatId: string, msgs: ChatMessage[]): void {
  try {
    window.localStorage.setItem(
      `${MESSAGES_STORAGE_PREFIX}${chatId}`,
      JSON.stringify(msgs),
    );
  } catch {
    // ignore
  }
}

// Send a message
export async function sendChatMessage({
  chatId,
  senderId,
  senderUsername,
  senderAvatar,
  text,
  replyToStory,
  otherUser,
  onReceivedReply,
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
  onReceivedReply?: (reply: ChatMessage) => void;
}): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    chatId,
    senderId,
    senderUsername,
    senderAvatar: senderAvatar || "",
    text: text.trim(),
    createdAt: new Date().toISOString(),
    replyToStory,
    isRead: true,
  };

  // 1. Update messages list
  const currentMsgs = getStoredMessages(chatId, { username: senderUsername });
  const updatedMsgs = [...currentMsgs, newMsg];
  saveStoredMessages(chatId, updatedMsgs);

  // 2. Update conversation record
  const currentConvs = getStoredConversations({
    uid: senderId,
    username: senderUsername,
    avatar: senderAvatar,
  });

  const existingIdx = currentConvs.findIndex((c) => c.id === chatId);
  const updatedConv: ChatConversation = {
    id: chatId,
    participantIds: [senderId, otherUser.uid],
    participantUsernames: [senderUsername, otherUser.username],
    otherUser: {
      uid: otherUser.uid,
      username: otherUser.username,
      avatar: otherUser.avatar,
      location: otherUser.location,
      isOnline: true,
    },
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

  // 4. Simulated interactive reply if recipient is a curated traveler
  const curatedKey = otherUser.username.toLowerCase();
  if (CURATED_REPLIES[curatedKey]) {
    const replies = CURATED_REPLIES[curatedKey];
    const replyText = replies[Math.floor(Math.random() * replies.length)];

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        chatId,
        senderId: otherUser.uid,
        senderUsername: otherUser.username,
        senderAvatar: otherUser.avatar,
        text: replyText,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      const msgsNow = getStoredMessages(chatId, { username: senderUsername });
      saveStoredMessages(chatId, [...msgsNow, replyMsg]);

      // update conv unread count if user is not in active view
      const convsNow = getStoredConversations({
        uid: senderId,
        username: senderUsername,
      });
      const idx = convsNow.findIndex((c) => c.id === chatId);
      if (idx >= 0) {
        convsNow[idx].lastMessage = {
          text: replyText,
          senderUsername: otherUser.username,
          createdAt: replyMsg.createdAt,
        };
        convsNow[idx].updatedAt = replyMsg.createdAt;
        saveStoredConversations(
          { uid: senderId, username: senderUsername },
          convsNow,
        );
      }

      if (onReceivedReply) {
        onReceivedReply(replyMsg);
      }
    }, 1400);
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
