"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, type ChatUser } from "@/lib/api";
import "./dashboard.css";

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("chatify_token");
    if (!token) {
      router.replace("/");
      return;
    }

    apiRequest<ChatUser[]>("/api/users", {}, token)
      .then((data) => setUsers(data))
      .catch((err: Error) => {
        setError(err.message || "Could not load users.");
        if (err.message.includes("401")) {
          localStorage.removeItem("chatify_token");
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const currentEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("chatify_email")?.toLowerCase()
      : undefined;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => user.email.toLowerCase() !== currentEmail)
      .filter((user) => {
        const name = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          !query ||
          name.includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      });
  }, [users, search, currentEmail]);

  function logout() {
    localStorage.removeItem("chatify_token");
    localStorage.removeItem("chatify_email");
    localStorage.removeItem("chatify_user");
    router.replace("/");
  }

  return (
    <main className="chatify-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">C</span>
          <span>Chatify</span>
        </div>

        <div className="sidebar-heading">MESSAGES</div>
        <div className="user-search">
          <span>⌕</span>
          <input
            aria-label="Search users"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="people-heading">
          <span>People</span>
          <span className="people-count">{filteredUsers.length}</span>
        </div>

        <div className="people-list">
          {loading && <p className="muted">Loading people...</p>}
          {!loading && !error && filteredUsers.length === 0 && (
            <p className="muted">No other registered users found.</p>
          )}

          {filteredUsers.map((user) => {
            const fullName = `${user.firstName} ${user.lastName}`;

            return (
              <button
                key={user.id}
                className={`person ${selectedUser?.id === user.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedUser(user);
                  setMessage("");
                }}
              >
                <span className="avatar">
                  {user.firstName.charAt(0).toUpperCase()}
                  {user.lastName.charAt(0).toUpperCase()}
                </span>
                <span className="person-details">
                  <strong>{fullName}</strong>
                  <small>{user.email}</small>
                </span>
              </button>
            );
          })}

          {error && <p className="error-message">{error}</p>}
        </div>

        <button className="logout-button" onClick={logout}>
          ↪ Sign out
        </button>
      </aside>

      <section className="chat-area">
        <header className="dashboard-header">
          <div>
            <h1>Messages</h1>
            <p>Your space to connect and chat.</p>
          </div>
          <div className="header-mark">C</div>
        </header>

        {selectedUser ? (
          <div className="conversation">
            <div className="conversation-profile">
              <span className="avatar large">
                {selectedUser.firstName.charAt(0).toUpperCase()}
                {selectedUser.lastName.charAt(0).toUpperCase()}
              </span>
              <h2>
                {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <p>{selectedUser.email}</p>
              <span className="coming-soon">
                User selected · Messaging integration next
              </span>
            </div>

            <div className="empty-conversation">
              <span className="message-icon">✉</span>
              <h3>Start a conversation</h3>
              <p>
                Your chat with {selectedUser.firstName} will appear here once
                messaging is connected.
              </p>
            </div>

            <form
              className="message-composer"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage("");
              }}
            >
              <input
                placeholder="Messaging will be enabled in the next step..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled
              />
              <button type="submit" disabled>
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className="welcome-panel">
            <div className="welcome-illustration">
              <span>✉</span>
              <i />
              <b />
            </div>
            <h2>Your conversations start here.</h2>
            <p>
              Choose someone from the people list to open their conversation.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}