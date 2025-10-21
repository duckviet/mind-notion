import { useAuthStore } from "@/features/auth";
import { useCallback, useEffect, useState, useRef } from "react";

// Types would ideally move to the `entities` layer (e.g., entities/user, entities/document)
export type Cursor = { index: number; length: number };
export type User = { id: string; name: string; color: string; cursor: Cursor };

export type Message<T = unknown> = { type: string; payload?: T };

export type InitPayload = {
  self: User;
  users: User[];
  content: string;
  version: number;
};

export type CursorPayload = { id: string; cursor: Cursor };
export type DocUpdatePayload = { content: string; version: number };

// LocalStorage keys
const USER_ID_KEY = "collaborative_editor_user_id";
const USER_NAME_KEY = "collaborative_editor_user_name";

// Generate or get user ID from localStorage (SSR safe)
const getOrCreateUserId = (): string => {
  if (typeof window === "undefined") {
    return `user_${Date.now()}_${Math.random().toString(36)}`;
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export function useCollaborativeEditor() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [text, setText] = useState("");
  const [version, setVersion] = useState(0);
  const [self, setSelf] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const { user } = useAuthStore();
  const userId = user?.id;
  const userName = user?.name;
  const send = useCallback(
    (msg: Message) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    },
    [socket]
  );

  useEffect(() => {
    // Connect with user_id as query parameter
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    const ws = new WebSocket(`ws://localhost:8080/ws${qs}`);

    ws.onopen = () => {
      // Send join message with stored user name
      ws.send(JSON.stringify({ type: "join", payload: { name: userName } }));
    };

    ws.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      switch (msg.type) {
        case "init": {
          const p = msg.payload as InitPayload;
          setSelf(p.self);
          setUsers(p.users);
          setText(p.content);
          setVersion(p.version);

          // Update localStorage with the user info from server
          if (typeof window !== "undefined") {
            if (p.self.id !== userId) {
              localStorage.setItem(USER_ID_KEY, p.self.id);
            }
            if (p.self.name !== userName) {
              localStorage.setItem(USER_NAME_KEY, p.self.name);
            }
          }
          break;
        }
        case "user_joined": {
          const u = msg.payload as User;
          setUsers((prev) => {
            const exists = prev.some((x) => x.id === u.id);
            return exists ? prev : [...prev, u];
          });
          break;
        }
        case "user_left": {
          const { id } = msg.payload as { id: string };
          setUsers((prev) => prev.filter((u) => u.id !== id));
          break;
        }
        case "user_updated": {
          const u = msg.payload as User;
          setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
          if (self && u.id === self.id) setSelf(u);
          break;
        }
        case "cursor": {
          const p = msg.payload as CursorPayload;
          setUsers((prev) =>
            prev.map((u) => (u.id === p.id ? { ...u, cursor: p.cursor } : u))
          );
          break;
        }
        case "doc_state": {
          const p = msg.payload as DocUpdatePayload;
          setText(p.content);
          setVersion(p.version);
          break;
        }
        default:
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [userId, userName]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    send({ type: "doc_update", payload: { content: newText, version } });
  };

  const updateCursor = useCallback(() => {
    const el = textAreaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const length = Math.max(0, end - start);
    send({ type: "cursor", payload: { index: start, length } });
  }, [send]);

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    const handler = () => updateCursor();
    el.addEventListener("keyup", handler);
    el.addEventListener("mouseup", handler);
    el.addEventListener("select", handler as any);
    return () => {
      el.removeEventListener("keyup", handler);
      el.removeEventListener("mouseup", handler);
      el.removeEventListener("select", handler as any);
    };
  }, [textAreaRef, updateCursor]);

  const updateUserName = useCallback(
    (newName: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_NAME_KEY, newName);
      }
      send({ type: "join", payload: { name: newName } });
    },
    [send]
  );

  const clearUserData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(USER_NAME_KEY);
      // Reload page to get new user ID
      window.location.reload();
    }
  }, []);

  return {
    text,
    self,
    users,
    userId,
    userName,
    textAreaRef,
    handleTextChange,
    updateUserName,
    clearUserData,
  };
}
