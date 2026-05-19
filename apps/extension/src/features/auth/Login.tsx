import React, { useState } from "react";
import { User } from "../../core/types";

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitch: () => void;
}

export function Login({ onLogin, onSwitch }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "login",
        data: { username, password },
      });

      if (response.success) {
        onLogin(response.user);
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mn-auth-view">
      <div className="mn-auth-header">
        <h2>Welcome Back</h2>
        <p>Sign in to save notes to Mind Notion</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mn-form-group">
          <label htmlFor="mn-login-username">Username</label>
          <input
            id="mn-login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mn-form-group">
          <label htmlFor="mn-login-password">Password</label>
          <input
            id="mn-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="mn-status mn-status-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <button type="submit" className="mn-btn-save" disabled={loading} style={{ margin: 0 }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <div className="mn-auth-footer">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="mn-link-btn">
          Sign Up
        </button>
      </div>
    </div>
  );
}
