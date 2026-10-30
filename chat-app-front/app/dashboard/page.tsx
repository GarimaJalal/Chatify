"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  type ChatMessage,
  type ChatUser,
} from "@/lib/api";
import { createChatWebSocket } from "@/lib/websocket";
import "./dashboard.css";

export default function DashboardPage() {
  const router = useRouter();

  const chatSocketRef = useRef<ReturnType<
    typeof createChatWebSocket
  > | null>(null);

  const selectedUserRef = useRef<ChatUser | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const usersRef = useRef<ChatUser[]>([]);
  const currentUserIdRef = useRef<string | null>(null);
  const currentEmailRef = useRef<string | null>(null);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [lastMessageAt, setLastMessageAt] = useState<Record<string, number>>({});
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unreadUserIds, setUnreadUserIds] = useState<Set<string>>(
    () => new Set()
  );

  const getReadKey = useCallback(
    (userId: string) => `chatify_last_read_${userId}`,
    []
  );

  const loadConversation = useCallback(
    async (user: ChatUser) => {
      const token = localStorage.getItem("chatify_token");

      if (!token) {
        router.replace("/");
        return;
      }

      setLoadingMessages(true);
      setError("");

      try {
        const history = await apiRequest<ChatMessage[]>(
          `/api/messages/conversation/${user.id}`,
          {},
          token
        );

        // Ignore a response if the user switched conversations meanwhile.
        if (selectedUserRef.current?.id !== user.id) {
          return;
        }

        // Merge REST history with live messages received during the request.
        setMessages((previous) => {
          const merged = new Map<string, ChatMessage>();

          for (const item of history) {
            merged.set(item.id, item);
          }

          for (const item of previous) {
            const belongsToConversation =
              item.senderId === user.id ||
              item.recipientId === user.id;

            if (belongsToConversation) {
              merged.set(item.id, item);
            }
          }

          return [...merged.values()].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
        });

        const latestIncomingMessage = [...history]
          .reverse()
          .find((item) => item.senderId === user.id);

        if (latestIncomingMessage) {
          localStorage.setItem(
            getReadKey(user.id),
            latestIncomingMessage.createdAt
          );
        }

        setUnreadUserIds((previous) => {
          const next = new Set(previous);
          next.delete(user.id);
          return next;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Could not load conversation.";

        setError(errorMessage);

        if (errorMessage.includes("401")) {
          localStorage.removeItem("chatify_token");
          router.replace("/");
        }
      } finally {
        if (selectedUserRef.current?.id === user.id) {
          setLoadingMessages(false);
        }
      }
    },
    [getReadKey, router]
  );

  const refreshUnreadIndicators = useCallback(
    async (userList: ChatUser[]) => {
      const token = localStorage.getItem("chatify_token");
      const currentEmail = localStorage
        .getItem("chatify_email")
        ?.toLowerCase();

      if (!token) return;

      const unreadIds = new Set<string>();
      const latestActivity: Record<string, number> = {};

      await Promise.all(
        userList
          .filter(
            (user) => user.email.toLowerCase() !== currentEmail
          )
          .map(async (user) => {
            try {
              const conversation = await apiRequest<ChatMessage[]>(
                `/api/messages/conversation/${user.id}`,
                {},
                token
              );

              const latestMessageTime = conversation.reduce(
                (latest, item) =>
                  Math.max(latest, new Date(item.createdAt).getTime()),
                0
              );

              if (latestMessageTime > 0) {
                latestActivity[user.id] = latestMessageTime;
              }

              const lastRead = localStorage.getItem(getReadKey(user.id));

              const lastReadTime = lastRead
                ? new Date(lastRead).getTime()
                : 0;

              const hasUnread = conversation.some((item) => {
                return (
                  item.senderId === user.id &&
                  new Date(item.createdAt).getTime() > lastReadTime
                );
              });

              if (hasUnread) {
                unreadIds.add(user.id);
              }
            } catch {
              // A failed unread check should not block the people list.
            }
          })
      );

      setUnreadUserIds(unreadIds);
      setLastMessageAt(latestActivity);
    },
    [getReadKey]
  );

  // Keep refs synchronized with the latest React state.
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;

    if (selectedUser) {
      void loadConversation(selectedUser);
    } else {
      setMessages([]);
      setLoadingMessages(false);
    }
  }, [selectedUser, loadConversation]);


  useEffect(() => {
  if (loadingMessages) return;

  const messageList = messageListRef.current;

  if (!messageList) return;

  // Jump directly to the latest message after history loads.
  messageList.scrollTop = messageList.scrollHeight;
  }, [messages, loadingMessages, selectedUser]);

  // Load the current user's identity and registered users.
  useEffect(() => {
    const token = localStorage.getItem("chatify_token");

    if (!token) {
      router.replace("/");
      return;
    }

    currentEmailRef.current = localStorage
      .getItem("chatify_email")
      ?.toLowerCase() ?? null;

    try {
      const storedUser = localStorage.getItem("chatify_user");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        currentUserIdRef.current =
          typeof parsed.id === "string" ? parsed.id : null;
      }
    } catch {
      currentUserIdRef.current = null;
    }

    let cancelled = false;

    apiRequest<ChatUser[]>("/api/users", {}, token)
      .then(async (data) => {
        if (cancelled) return;

        usersRef.current = data;
        setUsers(data);

        await refreshUnreadIndicators(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;

        setError(err.message || "Could not load users.");

        if (err.message.includes("401")) {
          localStorage.removeItem("chatify_token");
          router.replace("/");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, refreshUnreadIndicators]);

  // Create exactly one authenticated STOMP connection.
  useEffect(() => {
    const token = localStorage.getItem("chatify_token");

    if (!token) {
      router.replace("/");
      return;
    }

    const socket = createChatWebSocket(token, {
      onMessage: (incoming) => {
        const activeUser = selectedUserRef.current;

        const conversationUserId = incoming.senderId === currentUserIdRef.current? incoming.recipientId : incoming.senderId;
        setLastMessageAt((previous) => ({
          ...previous,
          [conversationUserId]: new Date(incoming.createdAt).getTime(),
        }));

        const belongsToOpenConversation =
          activeUser !== null &&
          (incoming.senderId === activeUser.id ||
            incoming.recipientId === activeUser.id);

        if (belongsToOpenConversation && activeUser) {
          setMessages((previous) => {
            if (previous.some((item) => item.id === incoming.id)) {
              return previous;
            }

            return [...previous, incoming].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
          });

          // Messages from the selected person are immediately marked read.
          if (incoming.senderId === activeUser.id) {
            localStorage.setItem(
              getReadKey(activeUser.id),
              incoming.createdAt
            );

            setUnreadUserIds((previous) => {
              const next = new Set(previous);
              next.delete(activeUser.id);
              return next;
            });
          }

          return;
        }

        // The sender also receives a copy of their own sent message.
        // Do not treat that copy as an unread incoming message.
        const isOwnMessage =
          currentUserIdRef.current !== null &&
          incoming.senderId === currentUserIdRef.current;

        if (isOwnMessage) return;

        const sender = usersRef.current.find(
          (user) => user.id === incoming.senderId
        );

        if (
          sender &&
          sender.email.toLowerCase() !== currentEmailRef.current
        ) {
          setUnreadUserIds((previous) => {
            const next = new Set(previous);
            next.add(sender.id);
            return next;
          });
        }
      },

      onError: (errorMessage) => {
        setError(errorMessage);
      },
    });

    chatSocketRef.current = socket;
    socket.connect();

    return () => {
      if (chatSocketRef.current === socket) {
        chatSocketRef.current = null;
      }

      void socket.disconnect();
    };
  }, [getReadKey, router]);

  const filteredUsers = useMemo(() => {
  const query = search.trim().toLowerCase();
  const email = currentEmailRef.current;

  return users
    .filter((user) => user.email.toLowerCase() !== email)
    .filter((user) => {
      const name =
        `${user.firstName} ${user.lastName}`.toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    })
    .sort(
      (a, b) =>
        (lastMessageAt[b.id] ?? 0) -
        (lastMessageAt[a.id] ?? 0)
    );
}, [users, search, lastMessageAt]);

  async function handleSendMessage(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const content = message.trim();
    const recipient = selectedUser;
    const socket = chatSocketRef.current;

    if (!recipient || !content || sending) return;

    if (!socket?.client.connected) {
      setError("Chat is connecting. Please wait a moment and try again.");
      return;
    }

    setSending(true);
    setError("");

    try {
      // Send through STOMP only. The server persists and broadcasts it.
      socket.sendMessage({
        recipientId: recipient.id,
        content,
      });

      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send message."
      );
    } finally {
      setSending(false);
    }
  }

  function logout() {
    void chatSocketRef.current?.disconnect();
    chatSocketRef.current = null;

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

          {filteredUsers.map((user) => (
            <button
              key={user.id}
              className={`person ${
                selectedUser?.id === user.id ? "active" : ""
              }`}
              onClick={() => {
                selectedUserRef.current = user;
                setSelectedUser(user);
                setMessage("");
              }}
            >
              <span className="avatar">
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName.charAt(0).toUpperCase()}
              </span>

              <span className="person-details">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <small>{user.email}</small>
              </span>

              {unreadUserIds.has(user.id) && (
                <span
                  className="unread-dot"
                  aria-label="Unread messages"
                  title="Unread messages"
                />
              )}
            </button>
          ))}

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
            </div>

            <div className="message-list" aria-live="polite" ref={messageListRef}>
              {loadingMessages && (
                <p className="muted">Loading conversation...</p>
              )}

              {!loadingMessages && messages.length === 0 && (
                <div className="empty-conversation">
                  <span className="message-icon">✉</span>
                  <h3>Start a conversation</h3>
                  <p>Send your first message to {selectedUser.firstName}.</p>
                </div>
              )}

              {!loadingMessages &&
                messages.map((item) => {
                  const isMine = item.senderId !== selectedUser.id;

                  return (
                    <div
                      key={item.id}
                      className={`message-row ${
                        isMine ? "message-mine" : "message-theirs"
                      }`}
                    >
                      <div className="message-bubble">
                        <p>{item.content}</p>
                        <time dateTime={item.createdAt}>
                          {new Date(item.createdAt).toLocaleString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  );
                })}
            </div>

            <form className="message-composer" onSubmit={handleSendMessage}>
              <input
                aria-label="Write a message"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                disabled={sending}
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
              >
                {sending ? "Sending..." : "Send"}
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
