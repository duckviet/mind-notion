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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Create Account</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Full Name</label>
          <input
            type="text"
            className="border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6}
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <div className="text-sm text-center">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-blue-600 hover:underline">
          Sign In
        </button>
      </div>
    </div>
  );
}
