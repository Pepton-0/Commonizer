"use strict";

const WebSocketServer = require("ws").Server; // Is this a class?
const port = 3457;
const wsServer = new WebSocketServer({ port: port });

const a = {
	port: "3306",
	name: "test",
};
console.log(a.port);

wsServer.on("connection", function (ws) {
	console.log("--websocket connected--");
	ws.on("message", function (message) {
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

console.log("websocket server start. port=", +port);