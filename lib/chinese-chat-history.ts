import { basePath } from "@/lib/utils";

export interface SavedMessagePart {
  type: "text" | "file";
  text?: string;
  url?: string;
  mediaType?: string;
  filename?: string;
}

export interface SavedChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: SavedMessagePart[];
}

export interface ChineseChatHistoryItem {
  id: string;
  title: string;
  topic: string;
  messages: SavedChatMessage[];
  updatedAt: string;
}

export function createChineseChatId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chi-chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getChineseChatHistory(topic?: string): Promise<ChineseChatHistoryItem[]> {
  try {
    const url = topic
      ? `${basePath}/api/chinese-chat-history?topic=${encodeURIComponent(topic)}`
      : `${basePath}/api/chinese-chat-history`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) return [];
    const json = (await response.json()) as { items?: ChineseChatHistoryItem[] };
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

export async function getChineseChatHistoryItem(id: string): Promise<ChineseChatHistoryItem | null> {
  try {
    const response = await fetch(`${basePath}/api/chinese-chat-history?chatId=${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { item?: ChineseChatHistoryItem | null };
    return json.item ?? null;
  } catch {
    return null;
  }
}

export async function upsertChineseChatHistory(item: ChineseChatHistoryItem) {
  try {
    const response = await fetch(`${basePath}/api/chinese-chat-history`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error("save failed");
    }
    window.dispatchEvent(new CustomEvent("chinese-chat-history:changed"));
  } catch {
    // Keep history writes silent in UI.
  }
}

export async function deleteChineseChatHistoryItem(id: string) {
  try {
    const response = await fetch(`${basePath}/api/chinese-chat-history?chatId=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("delete failed");
    }
    window.dispatchEvent(new CustomEvent("chinese-chat-history:changed"));
  } catch {
    // Keep deletes silent in UI.
  }
}

// --- Teacher: view students' chat history ---

export interface ChineseStudentSummary {
  id: string;
  displayName: string;
  username: string;
  count: number;
  lastUpdatedAt: string | null;
}

export async function getChineseStudents(): Promise<ChineseStudentSummary[]> {
  try {
    const response = await fetch(`${basePath}/api/chinese-chat-history/teacher`, {
      credentials: "include",
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { students?: ChineseStudentSummary[] };
    return Array.isArray(json.students) ? json.students : [];
  } catch {
    return [];
  }
}

export async function getChineseStudentChatHistory(
  studentId: string,
  topic?: string,
): Promise<ChineseChatHistoryItem[]> {
  try {
    const params = new URLSearchParams({ studentId });
    if (topic) params.set("topic", topic);
    const response = await fetch(
      `${basePath}/api/chinese-chat-history/teacher?${params.toString()}`,
      { credentials: "include" },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { items?: ChineseChatHistoryItem[] };
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

// --- Teacher: view students' Science chat history ---
// Science chats live in the same collection as Chinese ones, distinguished by
// topic. They are served by a dedicated teacher endpoint.

export async function getScienceStudents(): Promise<ChineseStudentSummary[]> {
  try {
    const response = await fetch(`${basePath}/api/science-chat-history/teacher`, {
      credentials: "include",
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { students?: ChineseStudentSummary[] };
    return Array.isArray(json.students) ? json.students : [];
  } catch {
    return [];
  }
}

export async function getScienceStudentChatHistory(
  studentId: string,
  topic?: string,
): Promise<ChineseChatHistoryItem[]> {
  try {
    const params = new URLSearchParams({ studentId });
    if (topic) params.set("topic", topic);
    const response = await fetch(
      `${basePath}/api/science-chat-history/teacher?${params.toString()}`,
      { credentials: "include" },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { items?: ChineseChatHistoryItem[] };
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

// --- Teacher: view students' Humanities chat history ---
// Humanities chats live in the same collection as Chinese ones, distinguished
// by topic. They are served by a dedicated teacher endpoint.

export async function getHumanitiesStudents(): Promise<ChineseStudentSummary[]> {
  try {
    const response = await fetch(`${basePath}/api/humanities-chat-history/teacher`, {
      credentials: "include",
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { students?: ChineseStudentSummary[] };
    return Array.isArray(json.students) ? json.students : [];
  } catch {
    return [];
  }
}

export async function getHumanitiesStudentChatHistory(
  studentId: string,
  topic?: string,
): Promise<ChineseChatHistoryItem[]> {
  try {
    const params = new URLSearchParams({ studentId });
    if (topic) params.set("topic", topic);
    const response = await fetch(
      `${basePath}/api/humanities-chat-history/teacher?${params.toString()}`,
      { credentials: "include" },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { items?: ChineseChatHistoryItem[] };
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}
