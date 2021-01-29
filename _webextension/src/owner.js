// TODO 1. SetCursorPos, GetCursorPosを高DPIに対応させること.
// TODO 2. screenElementでの割合計算が上手くいっていないので修正すること

// TODO なんでroomIdがundefinedなんだ？
// TODO どうして、sender.jsも起動しちゃうんだ？(content_scriptsにsender.jsも入れた場合)

console.log("Load owner.js script");

let localStream = null;
let negotiationneededCounter = 0;

if (window.location.pathname.indexOf("/make") == 0) {
	window.onload = async function () {
		console.log("activate owner.js");
		side = "owner";
		roomId = window.roomId;
		console.log(window.roomId);
		const webutilLoader = async () => {
			const src = chrome.runtime.getURL("webutil.js");
			webutil = await import(src);
			ws = webutil.prepareWebSocket(side);
			ws.onopen = (e) => {
				webutil.sendWsMessage(ws, roomId, side, "registry");
			};
			ws.onmessage = (e) => {
				console.log("(owner) ws onmessage() data:" + e.data.substr(0, 25) + "...");
				const message = JSON.parse(e.data);
				switch (message.type) {
					case "match": {
						// Make offer to start peer connection.
						console.log("Make offer to start peer connection");
						connect();
						break;
					}
					case "answer": {
						console.log("(owner) Received answer.");
						setAnswer(message);
						break;
					}
					case "candidate": {
						console.log("Received ICE candidate ...");
						const candidate = new RTCIceCandidate(message.ice);
						console.log("  Info: " + candidate.toString().substr(0, 25) + "...");
						addIceCandidate(candidate);
						break;
					}
					case "close": {
						console.log("peer is closed ...");
						hangUp();
						break;
					}
					case "pong": {
						console.log("pong!");
						break;
					}
					default: {
						console.log("Invalid message: " + message.type);
						break;
					}
				}
			};
		};
		await webutilLoader();
		activate();
	};

} else {
	console.warn("The curren page is not for the owner.");
}

// Start setup for screen sharing.
async function activate() {
	console.log("owner.js has activated.\nThe room id is: " + roomId);

	// Prepare the screen which will be shared.
	try {
		localStream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
		});
		console.log("Suceeded to acquire screen capture permission");
	} catch (err) {
		webutil.goErrorPage("Failed to acquire screen capture permission");
	}

	// Show the screen for debugging.
	document.getElementById("debugScreen").srcObject = localStream;

	document.getElementById("testButton").addEventListener("click", (e) => {
    const message = JSON.stringify({ type: "ping" });
		webutil.sendWsMessage(ws, roomId, side, message);
		console.log("ping!");
	});
};

function connect() {
  if (!peerConnection) {
    console.log("--Make Offer");
    peerConnection = prepareNewConnection(); // as Offer
  } else { // すでに接続されていたら処理しない
    console.warn("--Failed. Peer already exists.");
  }
}

function hangUp() {
	if (peerConnection) {
		if (peerConnection.iceConnectionState !== "closed") {
			peerConnection.close();
			peerConnection = null;
			negotiationneededCounter = 0;
      const message = JSON.stringify({ type: "close" });
      console.log("Send close message to signaling server");
			webutil.sendWsMessage(ws, roomId, side, message);
		}
	}
	webutil.goErrorPage();
}

// WebRTCを利用する準備をする
// Offer: SDPで、通信を始める側(Offer)と通信を受け入れる側(Answer)のうち、Offerのこと.
function prepareNewConnection() {
	// 自分のコンピュータの、グローバルなIPアドレスを取得する設定.
  const pc_config = {
    iceServers: [{ urls: "stun:stun.webrtc.ecl.ntt.com:3478" }],
	};

	const peer = new RTCPeerConnection(pc_config);

	if (localStream) {
		console.log("--Add local media stream");
		localStream
			.getTracks()
			.forEach((track) => peer.addTrack(track, localStream));
	}
	else {
		console.warn("--Failed. ");
		webutil.goErrorPage("--localStream was not found.");
	}

	mousePosChannel = peer.createDataChannel("mouse_pos");
		mousePosChannel.onopen = function () {
			console.log("--Mouse position data channel open");
		};
		mousePosChannel.onclose = function () {
			console.log("--Mouse position data channel close");
		};
		mousePosChannel.onmessage = function (e) {
			console.log("--Mouse position update: " + e.data);
			// case "remote": {
			// 	console.log("Remote");
			// 	console.log("Control: @" + message.control.x_ratio + ":" + message.control.y_ratio);
			// 	break;
			// }
	};

	// Offer側でネゴシエーションが必要になったときの処理を登録
	peer.onnegotiationneeded = async () => {
		try {
			// if (isOffer)...
			if (negotiationneededCounter === 0) {
				let offer = await peer.createOffer();
				console.log("--Suceeded createOffer() in promise");
				await peer.setLocalDescription(offer);
				console.log("--Suceeded setLocalDescription() in promise");

				// シグナリングサーバーに、行いたい接続について情報を送る
				sendSdp(peer.localDescription);

				negotiationneededCounter++;
			}
		} catch (err) {
			webutil.goErrorPage("--Failed. setLocalDescription(offer) " + err);
		}
	};

	// ICE Candidateを収集したときのイベント
	// ICE Candidate: P2Pをするとき、どんな通信経路が使えるかの候補
	peer.onicecandidate = (e) => {
		if (e.candidate) {
			console.log("--Found ICE candidate: " + e.candidate);
			sendIceCandidate(e.candidate);
		}
		else {
			console.log("--Empty ice event");
		}
	};

	peer.oniceconnectionstatechange = function () {
		console.log(
			"--ICE connection status has chaned to :["
			+ peer.iceConnectionState + "]"
		);
		switch (peer.iceConnectionState) {
			case "closed":
			case "failed":
				if (peerConnection)
					hangUp();
				break;
			case "disconnected":
				break;
		}
	};

	return peer;
}

// シグナリングサーバーに、行いたい接続について情報を送る
function sendSdp(sessionDescription) {
	console.log("--==Send session description to signaling server");
  const description = JSON.stringify(sessionDescription);
	webutil.sendWsMessage(ws, roomId, side, description);
	console.log("--==Sent SDP: " + description.substr(0, 25) + "...");
}

// ICE candaidate受信時にセットする
function addIceCandidate(candidate) {
  if (peerConnection) {
    peerConnection.addIceCandidate(candidate);
  } else {
    console.error("PeerConnection not exist!");
    return;
  }
}

// シグナリングサーバーに、接続手段の候補(ICE candidate)を送る
function sendIceCandidate(candidate) {
  console.log("--==Send ICE candidate");
	const message =
		JSON.stringify({ type: "candidate", ice: candidate });
  console.log("--==Sending candidate=" + message);
	webutil.sendWsMessage(ws, roomId, side, message);
}

async function setAnswer(sessionDescription) {
	if (!peerConnection) {
		webutil.goErrorPage("--peerConnection not exists!");
		return;
	}
	try {
		await peerConnection.setRemoteDescription(sessionDescription);
		console.log("--Suceeded setRemoteDescription(answer) in promise");
	} catch (err) {
		webutil.goErrorPage("--Failed setRemoteDescription(answer) " + err);
	}
}