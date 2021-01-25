"use strict";

const WebSocketServer = require("ws").Server; // Is this a class?
const port = process.env.PORT || 3457;
const wsServer = new WebSocketServer({ port: port });

wsServer.on("connection", function (ws) {
	console.log("--websocket connected--");
	ws.on("message", function (message) { // TODO ここのmessageをJSONにして、roomIdを取得する
		wsServer.clients.forEach(function each(client) {
			if (isSame(ws, client)) {
				console.log("-skip sender-");
			} else {
				client.send(message);
			}
		});
	});
});

function isSame(ws1, ws2) {
	return ws1 == ws2;
}

console.log("websocket server start. port=" + port);
