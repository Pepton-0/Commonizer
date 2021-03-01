console.log("Load sender.js script");

let screenElement = null;
let senderDebugElement = null;

if (window.location.pathname.indexOf("/join") == 0) {
	window.onload = async function () {
		side = "sender";
		screenElement = document.getElementById("screen");
		senderDebugElement = document.getElementById("debugConsole");
		roomId = document.getElementById("roomId").value;
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
					case "offer": {
						console.log("(" + side + ") Received offer ...");
						setOfferForSender(message);
						break;
					}
					case "candidate": {
						console.log("Received ICE candidate ...");
						const candidate = new RTCIceCandidate(message.ice);
						console.log("  Info: " + candidate.toString().substr(0, 25) + "...");
						addIceCandidateForSender(candidate);
						break;
					}
					case "close": {
						console.log("peer is closed ...");
						hangUpSender();
						break;
					}
					case "ping": {
						console.log("pong!");
						const message = JSON.stringify({ type: "pong" });
						webutil.sendWsMessage(ws, roomId, side, message);
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
		activateSender();
	};
}
else {
	console.warn("The curren page is not for the sender.");
}

function activateSender() {
	console.log("sender.js has activated.\nThe room id is: " + window.roomId);

	screenElement.addEventListener("mousedown", (e) => { console.log("mouse: down @" + e.clientX + ":" + e.clientY);
	});

	// こちらが動かしているときだけ、あちらのマウスの座標は変更される. あちらの人も自分で操作したい時があるだろうから.
	screenElement.addEventListener("mousemove", (e) => {
		if (mousePosChannel && mousePosChannel.readyState == "open") {
			// TODO yRatioが、本来より+0.5だけずれてる.
			const xRatio = e.clientX / screenElement.clientWidth;
			const yRatio = e.clientY / screenElement.clientHeight;
			console.log("mouse moved. @" + xRatio.toFixed(2) + ":" + yRatio.toFixed(2));
			senderDebugElement.innerHTML = "x:" + xRatio.toFixed(2) + ", " + "y:" + yRatio.toFixed(2);
			let message = JSON.stringify({
				"type": "remote",
				"control": {
					"x_ratio": xRatio,
					"y_ratio": (yRatio-0.5)
				}
			});
			mousePosChannel.send(message);
		}
	});
};

function hangUpSender() {
	if (peerConnection) {
		if (peerConnection.iceConnectionState !== "closed") {
			peerConnection.close();
			peerConnection = null;
      const message = JSON.stringify({ type: "close" });
      console.log("Send close message to signaling server");
			webutil.sendWsMessage(ws, roomId, side, message);
		}
	}
	webutil.goErrorPage();
}

// WebRTCを利用する準備をする
// Answer: SDPで、通信を始める側(Offer)と通信を受け入れる側(Answer)のうち、Offerのこと.
function prepareNewConnectionForSender() {
	// 自分のコンピュータの、グローバルなIPアドレスを取得する設定.
	const pc_config = {
		iceServers: [{ urls: "stun:stun.webrtc.ecl.ntt.com:3478" }],
	};

	const peer = new RTCPeerConnection(pc_config);
	// TODO こちらから、コントロール系の情報を送りたいなら、また別のPeerを生成する必要がある
	peer.onicecandidate = (e) => {
		if (e.candidate) {
			console.log("--Found ICE candidate: " + e.candidate);
			sendIceCandidateAsSender(e.candidate);
		} else {
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
					hangUpSender();
				break;
			case "disconnected":
				break;
		}
	};

	// リモートのMediaStreamTrackを受信した時
	peer.ontrack = async (evt) => {
		console.log("--peer.ontrack()");
		screenElement.srcObject = evt.streams[0];
		try {
			await screenElement.play();
		} catch (error) {
			console.log("--Error auto play:" + error);
		}
	};

	peer.ondatachannel = function (e) {
		console.log("ondatachannel:" + e.type);
		var received = e.channel;
		received.onopen = (e) => console.log("something open: " + e);
		received.onclose = (e) => console.log("something close:" + e);
	}

	// マウスの移動データを送信する準備
	mousePosChannel = peer.createDataChannel("mouse_pos");
	mousePosChannel.onopen = function () {
		console.log("--Mouse position data channel open");
	};
	mousePosChannel.onclose = function () {
		console.log("--Mouse position data channel close");
	};


	return peer;
}

// Answer側として、Offer側からのメッセージが届いたら、
// SDPをセットする
async function setOfferForSender(sessionDescription) {
  if (peerConnection) {
    console.error("--peerConnection alreay exist!");
	}
	peerConnection = prepareNewConnectionForSender();
	try {
		await peerConnection.setRemoteDescription(sessionDescription);
		console.log("--Succeeded setRemoteDescription(offer) in promise");
		makeAnswerAsSender();
	} catch (err) {
		console.error("--Failed setRemoteDescription(answer) ERROR: " + err);
	}
}

// Answer SDPを生成する
async function makeAnswerAsSender() {
  console.log("--==Send Answer. Creating remote session description...");
  if (!peerConnection) {
    console.error("--==peerConnection NOT exist!");
    return;
  }
  try {
    let answer = await peerConnection.createAnswer();
    console.log("--==Suceeded createAnswer() in promise");
    await peerConnection.setLocalDescription(answer);
    console.log("--==Suceeded setLocalDescription() in promise");
    sendSdpAsSender(peerConnection.localDescription);
  } catch (err) {
    console.error(err);
  }
}

// シグナリングサーバーに、接続手段の候補(ICE candidate)を送る
function sendIceCandidateAsSender(candidate) {
  console.log("--==Send ICE candidate");
	const message =
		JSON.stringify({ type: "candidate", ice: candidate });
  console.log("--==Sending candidate=" + message);
	webutil.sendWsMessage(ws, roomId, side, message);
}

// ICE candaidate受信時にセットする
function addIceCandidateForSender(candidate) {
  if (peerConnection) {
    peerConnection.addIceCandidate(candidate);
  } else {
    console.error("PeerConnection not exist!");
    return;
  }
}

// シグナリングサーバーに、行いたい接続について情報を送る
function sendSdpAsSender(sessionDescription) {
	console.log("--==Send session description to signaling server");
  const description = JSON.stringify(sessionDescription);
	webutil.sendWsMessage(ws, roomId, side, description);
	console.log("--==Sent SDP: " + description.substr(0, 25) + "...");
}
