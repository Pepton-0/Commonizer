// Prepare connection gate to a signaling server;
export function prepareWebSocket(side) {
  console.log("prepare a new ws connection");
  // シグナリングサーバへ接続する
  const wsUrl = "wss://commonizer0signaling.herokuapp.com/";
  // var wsUrl = "ws://localhost:3457/"; // before: 3001
  var ws = new WebSocket(wsUrl);
  ws.onerror = (e) => console.log("(" + side + ") ws onerror(): " + e);

  return ws;
}

export function goErrorPage(message){
  // window.location.href = "/error";
  console.error(message);
}

export function sendWsMessage(ws, roomId, side, content) {
  let json = JSON.parse("{}");
  json["roomId"] = roomId;
  json["side"] = side;
  json["content"] = content;
  ws.send(JSON.stringify(json));
}