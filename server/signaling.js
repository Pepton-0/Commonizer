"use strict";

const WebSocketServer = require("ws").Server; // Is this a class?
const port = process.env.PORT || 3457;
const wsServer = new WebSocketServer({ port: port });

// Dictionary of roomId and client.
// TODO あとで、シグナリングのできたペアは、除外するようにしたい.
let roomId_owner = { 0: "" };
let roomId_sender = { 0: "" };

wsServer.on("connection", function (ws) {
	console.log("--websocket connected--");
	ws.on("message", function (message) {
		// room id ごとの通信を受け持つ.
		let json = JSON.parse(message.toString());
		if (json && json["roomId"]) {
			let fromId = json["roomId"];
			let side = json["side"];
			let content = json["content"];

			if (content == "registry") {
				switch (side) {
					case "owner": {
						roomId_owner[fromId] = ws;
						console.log("Register owner: " + fromId);
						if (roomId_sender[fromId]) // connect()を開始する
							ws.send(JSON.stringify({ type: "match" }));

						break;
					}
					case "sender": {
						roomId_sender[fromId] = ws;
						console.log("Register sender: " + fromId);

						let owner = roomId_owner[fromId];
						if (owner) // connect()を開始する
							owner.send(JSON.stringify({ type: "match" }));

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
						if (roomId_sender[fromId]) {
							roomId_sender[fromId].send(content);
							console.log("Send info from owner to sender");
						}
						break;
					}
					case "sender": {
						if (roomId_owner[fromId]) {
							roomId_owner[fromId].send(content);
							console.log("Send info from sender to owner");
						}
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
