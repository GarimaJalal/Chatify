
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const WS_URL = API_URL.replace(/^http/, "ws") + "/ws";

export type IncomingChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
};

type WebSocketHandlers = {
  onMessage: (message: IncomingChatMessage) => void;
  onError?: (message: string) => void;
};

export function createChatWebSocket(
  token: string,
  handlers: WebSocketHandlers
) {
  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      client.subscribe(
        "/user/queue/messages",
        (frame: IMessage) => {
          try {
            const message = JSON.parse(
              frame.body
            ) as IncomingChatMessage;

            handlers.onMessage(message);
          } catch {
            handlers.onError?.(
              "Received an invalid message from the server."
            );
          }
        }
      );
    },

    onStompError: (frame) => {
      handlers.onError?.(
        frame.headers["message"] ??
          "The WebSocket server reported an error."
      );
    },

    onWebSocketError: () => {
      handlers.onError?.(
        "Could not connect to the chat server."
      );
    },
  });

  return {
    client,

    connect: () => client.activate(),

    disconnect: () => client.deactivate(),

    sendMessage: (request: {
      recipientId: string;
      content: string;
    }) => {
      if (!client.connected) {
        throw new Error("WebSocket is not connected.");
      }

      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(request),
      });
    },
  };
}
