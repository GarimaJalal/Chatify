"use client";

import { useState } from "react";
import "./globals.css";
import { useRouter } from "next/navigation";
import { apiRequest, type LoginResponse } from "@/lib/api";

type RegisterResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const router = useRouter();

  function switchMode(signUp: boolean) {
    setIsSignUp(signUp);
    setMessage("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      setMessageType("error");
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (isSignUp && !/^[0-9]{10}$/.test(phoneNumber)) {
      setMessageType("error");
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await apiRequest<RegisterResponse>("/api/users/register", {
          method: "POST",
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phoneNumber,
            password,
          }),
        });

        setMessageType("success");
        setMessage("Account created successfully! You can now sign in.");

        setIsSignUp(false);
        setPassword("");
        setFirstName("");
        setLastName("");
        setPhoneNumber("");
      } else {
        const result = await apiRequest<LoginResponse>("/api/users/login", {
          method: "POST",
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        });

        localStorage.setItem("chatify_token", result.token);
        localStorage.setItem("chatify_email", result.email);
        localStorage.setItem(
          "chatify_user",
          JSON.stringify({
            id: result.id,
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
            phoneNumber: result.phoneNumber,
          })
        );

        router.push("/dashboard");
      }
    } catch (error) {
      setMessageType("error");

      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";

      if (errorMessage.includes("409") || errorMessage.toLowerCase().includes("conflict")) {
        setMessage("An account with this email or phone number already exists.");
      } else if (errorMessage.includes("401")) {
        setMessage("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("400")) {
        setMessage("Please check your details and try again.");
      } else if (
        errorMessage.toLowerCase().includes("failed to fetch") ||
        errorMessage.toLowerCase().includes("networkerror")
      ) {
        setMessage(
          "Cannot connect to Chatify's server. Make sure Spring Boot is running on port 8080."
        );
      } else {
        setMessage(errorMessage || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/" aria-label="Chatify home">
          <span className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v8a3.5 3.5 0 0 1-3.5 3.5H10l-6 4v-6.5a3.5 3.5 0 0 1 0-1V5.5Z"
                fill="currentColor"
              />
              <circle cx="8" cy="9.5" r="1" fill="#6255EE" />
              <circle cx="12" cy="9.5" r="1" fill="#6255EE" />
              <circle cx="16" cy="9.5" r="1" fill="#6255EE" />
            </svg>
          </span>
          <span className="brand-name">Chatify</span>
        </a>

        <p className="brand-tagline">Connect · Chat · Belong</p>

        <div className="auth-heading">
          <h1>{isSignUp ? "Join Chatify" : "Welcome to Chatify"}</h1>
          <p>
            {isSignUp
              ? "Create your account and start connecting with people."
              : "Sign in to continue or create your account to get started with real-time messaging."}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={!isSignUp ? "tab active" : "tab"}
            onClick={() => switchMode(false)}
          >
            Sign In
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={isSignUp ? "tab active" : "tab"}
            onClick={() => switchMode(true)}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="name-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email ID</label>
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M10 18h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15" r="1.2" fill="currentColor" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8M6.2 6.2C4.1 7.6 3 12 3 12s3.5 7 9 7a9 9 0 0 0 3-.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {message && (
            <p
              className={`form-message ${messageType === "success" ? "success" : ""}`}
              role="status"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            <span>
              {isSubmitting
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </span>
            {!isSubmitting && (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>OR</p>
          <span />
        </div>

        <p className="auth-footer">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            onClick={() => switchMode(!isSignUp)}
          >
            {isSignUp ? "Sign In" : "Create account"}
          </button>
        </p>
      </section>

      <aside className="hero-panel">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-content">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-avatar">✦</div>
              <div>
                <strong>Chatify</strong>
                <p><span className="online-dot" /> Online</p>
              </div>
              <span className="chat-menu">•••</span>
            </div>

            <div className="chat-messages">
              <div className="message received">
                Hey! 👋
                <small>10:24 AM</small>
              </div>
              <div className="message sent">
                Welcome to Chatify!
                <br />
                Glad to have you here.
                <small>10:25 AM&nbsp; ✓✓</small>
              </div>
              <div className="message received">
                Let&apos;s chat! 💬
                <small>10:26 AM</small>
              </div>
            </div>

            <div className="chat-compose">
              <span>Type a message...</span>
              <span className="send-icon">➤</span>
            </div>
          </div>

          <div className="floating-chat float-left" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="4" fill="currentColor" />
              <path d="M2 20v-2a7 7 0 0 1 14 0v2H2Z" fill="currentColor" />
              <path
                d="M16 4a4 4 0 0 1 0 8m2 3a5 5 0 0 1 4 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="floating-chat float-right" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16v12H11l-6 4v-4H4V5Z" fill="currentColor" />
              <circle cx="9" cy="11" r="1" fill="#32A6A3" />
              <circle cx="12" cy="11" r="1" fill="#32A6A3" />
              <circle cx="15" cy="11" r="1" fill="#32A6A3" />
            </svg>
          </div>

          <div className="hero-heading">
            <p className="hero-eyebrow">YOUR PEOPLE. YOUR SPACE.</p>
            <h2>
              Real Conversations.
              <br />
              <span>Stronger Connections.</span>
            </h2>
            <p className="hero-description">
              Chat, share, and stay close with the people who matter most.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature">
              <div className="feature-icon lightning">ϟ</div>
              <h3>Instant Messaging</h3>
              <p>Real-time chats, no delays.</p>
            </div>

            <div className="feature">
              <div className="feature-icon people">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M2 20v-2a7 7 0 0 1 14 0v2H2Zm13-15a3.5 3.5 0 0 1 0 6.8m2 2.2a5 5 0 0 1 5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Group Chats</h3>
              <p>Stay connected with your circle.</p>
            </div>

            <div className="feature">
              <div className="feature-icon shield">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Secure &amp; Private</h3>
              <p>Your conversations matter.</p>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          <span>CHATIFY</span>
          <span>CONNECT WITH A LITTLE MORE MEANING.</span>
        </div>
      </aside>
    </main>
  );
}