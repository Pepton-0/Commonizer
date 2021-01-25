// Prepare connection gate to a signaling server;
export function prepareWebSocket() {
  console.log("prepare a new ws connection");
  // シグナリングサーバへ接続する
  //const wsUrl = "wss://commonizer0signaling.herokuapp.com/";
  var wsUrl = "ws://localhost:3457/"; // before: 3001
  var ws = new WebSocket(wsUrl);
  ws.onopen = (e) => console.log("ws open()");
  ws.onerror = (e) => console.log("ws onerror(): " + e);


  return ws;
}

export function goErrorPage(message){
  // window.location.href = "/error";
  console.error(message);
}