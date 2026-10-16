const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ChatUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
};

export type SendMessageRequest = {
  recipientId: string;
  content: string;
};

export type LoginResponse = {
  token: string;
  tokenType: string;
  expiresIn: number;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export type RegisterResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}