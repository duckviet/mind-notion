import React, { useState } from "react";
import { User } from "../../../core/types";

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
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mn-flex-col mn-gap-4">
      <h2 className="mn-title">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="mn-flex-col mn-gap-3">
        <div className="mn-flex-col mn-gap-1">
          <label className="mn-label">Username</label>
          <input
            type="text"
            className="mn-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mn-flex-col mn-gap-1">
          <label className="mn-label">Password</label>
          <input
            type="password"
            className="mn-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="mn-text-red mn-text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mn-btn-primary"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="mn-text-sm mn-text-center">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="mn-link">
          Sign Up
        </button>
      </div>
    </div>
  );
}
