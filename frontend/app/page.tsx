"use client";

import { HomePage } from "@/page/home";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cursor = { index: number; length: number };
type User = { id: string; name: string; color: string; cursor: Cursor };

type Message<T = unknown> = { type: string; payload?: T };

type InitPayload = {
  self: User;
  users: User[];
  content: string;
  version: number;
};

type CursorPayload = { id: string; cursor: Cursor };
type DocUpdatePayload = { content: string; version: number };

export default function Home() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [text, setText] = useState("");
  const [version, setVersion] = useState(0);
  const [self, setSelf] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const send = useCallback(
    (msg: Message) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    },
    [socket]
  );

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => {
      // Optionally send a join with a random name
      const random = Math.floor(Math.random() * 1000);
      ws.send(
        JSON.stringify({ type: "join", payload: { name: `Guest ${random}` } })
      );
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
  }, []);

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

  const otherUsers = useMemo(
    () => users.filter((u) => (self ? u.id !== self.id : true)),
    [users, self]
  );

  return <HomePage />;
}
