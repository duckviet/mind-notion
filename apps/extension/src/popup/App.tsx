import React, { useEffect, useState } from "react";
import { User } from "../core/types";
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { NoteEditor } from "./features/note/NoteEditor";
 export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"login" | "register" | "app">("login");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: "getUser" });
      if (response.authenticated && response.user) {
        setUser(response.user);
        setView("app");
      } else {
        setView("login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setView("login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await chrome.runtime.sendMessage({ action: "logout" });
    setUser(null);
    setView("login");
  };

  if (isLoading) {
    return <div className="mn-text-center" style={{ padding: "16px" }}>Loading...</div>;
  }

  return (
    <div className="mn-container">
      <header className="mn-header">
        <div className="mn-logo">Mind Notion</div>
        {user && (
          <button onClick={handleLogout} className="mn-logout-btn">
            Logout
          </button>
        )}
      </header>

      {view === "login" && (
        <Login onLogin={(u) => { setUser(u); setView("app"); }} onSwitch={() => setView("register")} />
      )}
      {view === "register" && (
        <Register onRegister={(u) => { setUser(u); setView("app"); }} onSwitch={() => setView("login")} />
      )}
      {view === "app" && user && (
        <NoteEditor user={user} />
      )}
    </div>
  );
}
