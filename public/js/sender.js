import { prepareWebSocket, goErrorPage, sendWsMessage} from "/js/utility/webutil.js";

let roomId = window.roomId;
let side = "sender";
let ws = prepareWebSocket();
let screenElement = document.getElementById("screen");
let peerConnection = null;

ws.onopen = (e) => {
	sendWsMessage(ws, roomId, side, "registry");
};
ws.onmessage = (e) => {
	console.log("(owner) ws onmessage() data:" + e.data);
	const message = JSON.parse(e.data);
	switch (message.type) {
		case "answer": {
			console.log("(owner) Received answer.");
			// setAnswer(message);
			break;
		}
		case "candidate": {
			console.log("Received ICE candidate ...");
			const candidate = new RTCIceCandidate(message.ice);
			console.log("  Info: " + candidate);
			// addIceCandidate(candidate);
			break;
		}
		case "close": {
			console.log("peer is closed ...");
			// hangUp();
			break;
		}
		case "ping": {
			console.log("pong!");
      const message = JSON.stringify({ type: "pong" });
			sendWsMessage(ws, roomId, side, message);
			break;
		}
		default: {
			console.log("Invalid message: " + message.type);
			break;
		}
	}
};

window.onload = function () {
	console.log("sender.js has activated.\nThe room id is: " + window.roomId);

	screenElement.addEventListener("mousedown", (e) => { console.log("mouse: down @" + e.clientX + ":" + e.clientY); });
	// TODO こちらが動かしているときだけ、あちらのマウスの座標は変更されるようにしたい. あちらの人も自分で操作したい時があるだろうから.
};