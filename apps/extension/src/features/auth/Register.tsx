import React, { useState } from "react";
import { User } from "../../core/types";

interface RegisterProps {
  onRegister: (user: User) => void;
  onSwitch: () => void;
}

export function Register({ onRegister, onSwitch }: RegisterProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "register",
        data: { name, username, email, password },
      });

      if (response.success) {
        onRegister(response.user);
      } else {
        setError(response.error || "Registration failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mn-auth-view">
      <div className="mn-auth-header">
        <h2>Create Account</h2>
        <p>Join Mind Notion to save your notes</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mn-form-group">
          <label htmlFor="mn-reg-name">Full Name</label>
          <input
            id="mn-reg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mn-form-group">
          <label htmlFor="mn-reg-username">Username</label>
          <input
            id="mn-reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mn-form-group">
          <label htmlFor="mn-reg-email">Email</label>
          <input
            id="mn-reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mn-form-group">
          <label htmlFor="mn-reg-password">Password</label>
          <input
            id="mn-reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && (
          <div className="mn-status mn-status-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <button type="submit" className="mn-btn-save" disabled={loading} style={{ margin: 0 }}>
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>
      <div className="mn-auth-footer">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="mn-link-btn">
          Sign In
        </button>
      </div>
    </div>
  );
}
