// TODO 何故amuseがあると上手くいくのかを追及する
// TODO インストーラー作成:(.NETCore, registry, commonizer_webextensionで、拡張機能IDを登録・exeのpath設定)
// firefox用を作ろう.
// TODO 拡張機能の実行について、ユーザー名に半角スペースや記号が入っているものは、エラーが起きた。(ただのタイプミス？)
// TODO 滑らかなmouse移動をしたい. ネイティブ側で、通信ごとのマウス位置を補完・クリック時には、テレポートするようにすれば？
// TODO senderで、e.keyCodeが非推奨となっている
// TODO 簡単なSenderのアクセス方法がほしい(QRコード、URLをメール等に送信) -> とりあえず6文字にした

console.log("Load owner.js script");

let localStream = null;
let negotiationneededCounter = 0;

if (window.location.pathname.indexOf("/make") == 0) {
	window.onload = async function () {
		side = "owner";
		console.log(window.roomId);
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
					case "match": {
						// Make offer to start peer connection.
						console.log("Make offer to start peer connection");
						connectAsOwner();
						break;
					}
					case "answer": {
						console.log("(owner) Received answer.");
						setAnswerForOwner(message);
						break;
					}
					case "candidate": {
						console.log("Received ICE candidate ...");
						const candidate = new RTCIceCandidate(message.ice);
						console.log("  Info: " + candidate.toString().substr(0, 25) + "...");
						addIceCandidateForOwner(candidate);
						break;
					}
					case "close": {
						console.log("peer is closed ...");
						hangUpOwner();
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
		activateOwner();
	};
} else {
	console.log("The curren page is not for the owner.");
}

// Start setup for screen sharing.
async function activateOwner() {
	console.log("owner.js has activated.\nThe room id is: " + roomId);

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

	// Prepare the screen which will be shared.
	try {
		localStream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
		});
		console.log("Suceeded to acquire screen capture permission");
	} catch (err) {
		webutil.goErrorPage("Failed to acquire screen capture permission");
		return;
	}

	// Show the screen for debugging.
	let debugScreen = document.getElementById("debugScreen");
	debugScreen.srcObject = localStream;

	let listenerActive = true;
	testButton = document.getElementById("testButton");
	testButton.addEventListener("click", (e) => {
		let func = () => {
			/*
			const message = JSON.stringify({ type: "ping" });
			webutil.sendWsMessage(ws, roomId, side, message);
			console.log("ping!");*/
			const msg0 = JSON.stringify({
				"order": "set_mouse_ratio",
				"x_ratio": "0.2",
				"y_ratio": "0.4"
			});
			const msg1 = JSON.stringify({
				"order": "mouse_down",
				"number": 0
			});
			const msg2 = JSON.stringify({
				"order": "mouse_up",
				"number": 0
			});
			chrome.runtime.sendMessage(msg0);
			chrome.runtime.sendMessage(msg1);
			chrome.runtime.sendMessage(msg2);
		};
		window.setTimeout(func, 3 * 1000);
	});

	document.addEventListener("mousedown", (e) => {
		var button = e.button ? e.button : 0; // 中身が空の場合もあるので、確認しておく
		console.log("mouse: down @" + "["+button+"]");
	});

	document.addEventListener("mouseup", (e) => {
		var button = e.button ? e.button : 0; // 中身が空の場合もあるので、確認しておく
		console.log("mouse: up @" + "["+button+"]");
	});
};

function connectAsOwner() {
  if (!peerConnection) {
    console.log("--Make Offer");
    peerConnection = prepareNewConnectionForOwner(); // as Offer
  } else { // すでに接続されていたら処理しない
    console.warn("--Failed. Peer already exists.");
  }
}

function hangUpOwner() {
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
function prepareNewConnectionForOwner() {
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

	peer.ondatachannel = function (e) {
		var receivedChannel = e.channel;
		console.log("Received some datachannel: " + e.type);
		// TODO 名前が、RemoteInputChannelであるかどうか判断できるようにしたい.
		receivedChannel.onopen = () => console.log("--Remote input data channel open");
		receivedChannel.onclose = () => console.log("--Remote input data channel close");
		receivedChannel.onmessage = function (e) {
			console.log("--Remote input update: " + e.data);
			var jsonMsg = JSON.parse(e.data);
			switch (jsonMsg["type"]) {
				case "mouse_down":
					chrome.runtime.sendMessage(JSON.stringify({
						"order": "mouse_down",
						"number": jsonMsg["control"]["number"]
					}
					));
					break;
				case "mouse_up":
					chrome.runtime.sendMessage(JSON.stringify({
						"order": "mouse_up",
						"number": jsonMsg["control"]["number"]
					}
					));
					break;
			 	case "mouse_move":
					chrome.runtime.sendMessage(JSON.stringify(
						{
						"order": "set_mouse_ratio",
						"x_ratio": jsonMsg["control"]["x_ratio"],
						"y_ratio": (jsonMsg["control"]["y_ratio"])
						}
					));
					break;
				case "key_down":
					chrome.runtime.sendMessage(JSON.stringify(
						{
						"order": "key_down",
							"keycode": jsonMsg["control"]["keycode"]
						}
					));
					break;
				case "key_up":
					chrome.runtime.sendMessage(JSON.stringify(
						{
						"order": "key_up",
							"keycode": jsonMsg["control"]["keycode"]
						}
					));
					break;
				default:
					console.log("nothing was done on remote input data channel:" + e.data);
					break;
			 }
		}
	}

	var amuse = peer.createDataChannel("amuse");
	amuse.onopen = (e) => console.log("amuse open: " + e);
	amuse.onclose = (e) => console.log("amuse close:" + e);

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
				sendSdpAsOwner(peer.localDescription);

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
			sendIceCandidateAsOwner(e.candidate);
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
					hangUpOwner();
				break;
			case "disconnected":
				break;
		}
	};

	return peer;
}

// シグナリングサーバーに、行いたい接続について情報を送る
function sendSdpAsOwner(sessionDescription) {
	console.log("--==Send session description to signaling server");
  const description = JSON.stringify(sessionDescription);
	webutil.sendWsMessage(ws, roomId, side, description);
	console.log("--==Sent SDP: " + description.substr(0, 25) + "...");
}

// ICE candaidate受信時にセットする
function addIceCandidateForOwner(candidate) {
  if (peerConnection) {
    peerConnection.addIceCandidate(candidate);
  } else {
    console.error("PeerConnection not exist!");
    return;
  }
}

// シグナリングサーバーに、接続手段の候補(ICE candidate)を送る
function sendIceCandidateAsOwner(candidate) {
  console.log("--==Send ICE candidate");
	const message =
		JSON.stringify({ type: "candidate", ice: candidate });
  console.log("--==Sending candidate=" + message);
	webutil.sendWsMessage(ws, roomId, side, message);
}

async function setAnswerForOwner(sessionDescription) {
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