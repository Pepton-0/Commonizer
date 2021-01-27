"use strict";

const WebSocketServer = require("ws").Server; // Is this a class?
const port = process.env.PORT || 3457;
const wsServer = new WebSocketServer({ port: port });

// Dictionary of roomId and client.
let roomId_owner = {0:""};
let roomId_sender = {0:""};

wsServer.on("connection", function (ws) {
	console.log("--websocket connected--");
	ws.on("message", function (message) {
		// room id ごとの通信を受け持つ.
		let json = JSON.parse(message.toString());
		console.log("JSON: " + message.toString());
		if (json && json["roomId"]) {
			let fromId = json["roomId"];
			let side = json["side"];
			let content = json["content"];

			if (content == "registry") {
				switch (side) {
					case "owner": {
						roomId_owner[fromId] = ws;
						console.log("Register owner: " + fromId);
						break;
					}
					case "sender": {
						roomId_sender[fromId] = ws;
						console.log("Register sender: " + fromId);
						break;
					}
					default: {
						console.error("Failed registering. Invalid side: " + side);
						break;
					}
				}
			} else {
				switch (side) {
					case "owner": {
						if (roomId_sender[fromId])
							roomId_sender[fromId].send(content);
						break;
					}
					case "sender": {
						if (roomId_owner[fromId])
							roomId_owner[fromId].send(content);
						break;
					}
					default: {
						console.error("Failed sending. Invalid side: " + side);
						break;
					}
				}
			}
		}
		else {
			wsServer.clients.forEach(function each(client) {
				if (isSame(ws, client)) {
					console.log("-skip sender-: " + message);
				} else {
					console.log("-send message-");
					client.send(message);
				}
			});
		}
	});
});

function isSame(ws1, ws2) {
	return ws1 == ws2;
}

console.log("websocket server start. port=" + port);
