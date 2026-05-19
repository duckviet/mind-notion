import React, { useState } from "react";
import { User } from "../../../core/types";

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
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mn-flex-col mn-gap-4">
      <h2 className="mn-title">Create Account</h2>
      <form onSubmit={handleSubmit} className="mn-flex-col mn-gap-3">
        <div className="mn-flex-col mn-gap-1">
          <label className="mn-label">Full Name</label>
          <input
            type="text"
            className="mn-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
          <label className="mn-label">Email</label>
          <input
            type="email"
            className="mn-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6}
          />
        </div>
        {error && <div className="mn-text-red mn-text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mn-btn-primary"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <div className="mn-text-sm mn-text-center">
        Already have an account?{" "}
        <button onClick={onSwitch} className="mn-link">
          Sign In
        </button>
      </div>
    </div>
  );
}
