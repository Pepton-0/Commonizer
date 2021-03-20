console.log("Load sender.js script");

let screenElement = null;
let screenElementRatio = 0.5; // width / height
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
		console.log("Load webutil");
		await webutilLoader();
		activateSender();
	};
}
else {
	console.log("The curren page is not for the sender.");
}

function activateSender() {
	console.log("sender.js has activated.\nThe room id is: " + window.roomId);

	let exitButton = document.getElementById("exitButton");
	exitButton.addEventListener("click", (e) => {
		if (ws) {
			ws.close();
		}
		if (peerConnection) {
			peerConnection.close();
		}
		window.location.href = "/chooser";
	});

	screenElement.addEventListener("mousedown", (e) => {
		var button = e.button ? e.button : 0; // 中身が空の場合もあるので、確認しておく
		console.log("mouse: down @" + e.clientX + ":" + e.clientY + "[" + button + "]");
		if (remoteInputChannel && remoteInputChannel.readyState == "open") {
			const message = JSON.stringify({
				"type": "mouse_down",
				"control": {
					"number": button
				}
			});
			remoteInputChannel.send(message);
		}
	});

	screenElement.addEventListener("mouseup", (e) => {
		var button = e.button ? e.button : 0;
		console.log("mouse: up @" + e.clientX + ":" + e.clientY + ":" + "[" + button + "]");
		if (remoteInputChannel && remoteInputChannel.readyState == "open") {
			const message = JSON.stringify({
				"type": "mouse_up",
				"control": {
					"number": button
				}
			});
			remoteInputChannel.send(message);
		}
	});

	// こちらが動かしているときだけ、あちらのマウスの座標は変更される. あちらの人も自分で操作したい時があるだろうから.
	screenElement.addEventListener("mousemove", (e) => {
		let xRatio = e.offsetX / screenElement.clientWidth;
		xRatio = Math.max(Math.min(Math.abs(xRatio), 1), 0);
		let yRatio = e.offsetY / screenElement.clientHeight;
		senderDebugElement.innerHTML = "x:" + xRatio.toFixed(2) + ", " + "y:" + yRatio.toFixed(2) +
			"____type:" + (typeof xRatio) + ":" + (typeof yRatio);

		if (remoteInputChannel && remoteInputChannel.readyState == "open") {
			const message = JSON.stringify({
				"type": "mouse_move",
				"control": {
					"x_ratio": xRatio,
					"y_ratio": yRatio
				}
			});
			remoteInputChannel.send(message);
		}

		window.onresize = resizeScreenElement;
	});

	document.onscroll = (e) => {
		return false;
	}

	document.onkeydown = (e) => {
		if (remoteInputChannel && remoteInputChannel.readyState == "open") {
			const message = JSON.stringify({
				"type": "key_down",
				"control": {
					"keycode": e.keyCode
				}
			})
			console.log("key:down@" + e.keyCode);
			remoteInputChannel.send(message);
		}
	};

	document.onkeyup = (e) => {
		if (remoteInputChannel && remoteInputChannel.readyState == "open") {
			const message = JSON.stringify({
				"type": "key_up",
				"control": {
					"keycode": e.keyCode
				}
			})
			console.log("key: up @" + e.keyCode);
			remoteInputChannel.send(message);
		}
	};
};

function hangUpSender() {
	if (peerConnection && peerConnection.iceConnectionState !== "closed") {
		peerConnection.close();
		peerConnection = null;
		const message = JSON.stringify({ type: "close" });
		console.log("Send close message to signaling server");
		webutil.sendWsMessage(ws, roomId, side, message);
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
		let mediaStream = evt.streams[0];
		screenElement.srcObject = evt.streams[0];
		try {
			await screenElement.play();
		} catch (error) {
			console.log("--Error auto play:" + error);
		}
		var isFirst = true;
		screenElement.addEventListener("resize", (e) => {
			if (isFirst) {
				screenElementRatio = mediaStream.getVideoTracks()[0].getSettings().aspectRatio;
				isFirst = false;
				resizeScreenElement();
			}
		});
	};

	peer.ondatachannel = function (e) {
		console.log("ondatachannel:" + e.type);
		var received = e.channel;
		received.onopen = (e) => console.log("something open: " + e);
		received.onclose = (e) => console.log("something close:" + e);
	}

	// マウスの移動データを送信する準備
	remoteInputChannel = peer.createDataChannel("mouse_pos");
	remoteInputChannel.onopen = function () {
		console.log("--Mouse position data channel open");
	};
	remoteInputChannel.onclose = function () {
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
}

function resizeScreenElement() {
	let newWidth = 10;
	let newHeight = 10;
	let minXByHeight = window.innerHeight * 0.85 * screenElementRatio;
	let minYByWidth = window.innerWidth * 0.85 * (1 / screenElementRatio);

	if (minYByWidth < window.innerHeight) {
		newHeight = minYByWidth;
		newWidth = newHeight * screenElementRatio;
	}
	else {
		newWidth = minXByHeight;
		newHeight = newWidth * (1 / screenElementRatio);
	}

	screenElement.style.width = newWidth + "px";
	screenElement.style.height = newHeight + "px";
	console.log("Resize screen element: " + newWidth + ":" + newHeight);
}