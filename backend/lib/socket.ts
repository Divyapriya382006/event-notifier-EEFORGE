import { WebSocket } from "ws";

const clients = new Set<WebSocket>();

export const addClient = (ws: WebSocket) => {
  clients.add(ws);
};

export const removeClient = (ws: WebSocket) => {
  clients.delete(ws);
};

export const broadcast = (data: any) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
};
