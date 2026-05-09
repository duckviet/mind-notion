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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Username</label>
          <input
            type="text"
            className="border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="text-sm text-center">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="text-blue-600 hover:underline">
          Sign Up
        </button>
      </div>
    </div>
  );
}
