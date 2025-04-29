import { WebSocketServer, WebSocket } from "ws";
import url from "url";
import os from "os";

let port = 8080;
const wss = new WebSocketServer({ port });

console.log(
  "server running on",
  Object.values(os.networkInterfaces())
    .reduce((prev, current) => {
      prev.push(...current);
      return prev;
    }, [])
    .filter((address) => address.family == "IPv4")
    .map((_address) => `${_address.address}:${port}`)
);

// 存储所有客户端连接
const clients = new Map();

wss.on("connection", (ws, request) => {
  // 解析 URL 中的查询参数
  let { device } = url.parse(request.url, true).query;
  device = JSON.parse(device);
  clients.set(device.clientId, { device, ws });
  // 客户端首次连接时注册身份
  ws.on("message", (msg, isBinary) => {
    if (isBinary) {
      // 转发逻辑
      const targetClient = clients.get("web_img");
      if (
        targetClient &&
        targetClient.ws &&
        targetClient.ws.readyState === WebSocket.OPEN
      ) {
        targetClient.ws.send(msg);
      }
    } else {
      clients.forEach((client, key) => {
        if (key == "web") {
          return;
        }

        if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
        }
      });
    }
  });

  // 清理断开连接
  ws.on("close", () => {
    clients.forEach((value, key) => {
      if (value === ws) clients.delete(key);
    });
  });
});
