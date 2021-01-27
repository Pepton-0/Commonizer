// TODO 2 senderは、wsセットアップ+wsのメッセージ出力機構だけ作る.
// TODO 3 ownerからsenderへ、何かしらのメッセージが流れることを検証
// TODO 4 ownerからsenderへ、screenの情報が送られるようにする
import { prepareWebSocket, goErrorPage, sendWsMessage} from "/js/utility/webutil.js";

const roomId = window.roomId;
const side = "owner";
const ws = prepareWebSocket("owner");
let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;

ws.onopen = (e) => {
	sendWsMessage(ws, roomId, side, "registry");
};
ws.onmessage = (e) => {
	console.log("(owner) ws onmessage() data:" + e.data);
	const message = JSON.parse(e.data);
	switch (message.type) {
		case "answer": {
			console.log("(owner) Received answer.");
			setAnswer(message);
			break;
		}
		case "candidate": {
			console.log("Received ICE candidate ...");
			const candidate = new RTCIceCandidate(message.ice);
			console.log("  Info: " + candidate);
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

// Start setup for screen sharing.
window.onload = async function () {
	console.log("owner.js has activated.\nThe room id is: " + roomId);

	// Prepare the screen which will be shared.
	try {
		localStream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
		});
		console.log("Succeed to acquire screen capture permission");
	} catch (err) {
		goErrorPage("Failed to acquire screen capture permission");
	}

	// Show the screen for debugging.
	document.getElementById("debugScreen").srcObject = localStream;

	document.getElementById("testButton").addEventListener("click", (e) => {
      const message = JSON.stringify({ type: "ping" });
		sendWsMessage(ws, roomId, side, message);
		console.log("ping!");
	});

	// Make offer to start peer connection.
	console.log("Make offer to start peer connection");
	connect();
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
			sendWsMessage(ws, roomId, side, message);
		}
	}
	goErrorPage();
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
		goErrorPage("--localStream was not found.");
	}

	// Offer側でネゴシエーションが必要になったときの処理を登録
	peer.onnegotiationneeded = async () => {
		try {
			// if (isOffer)...
			if (negotiationneededCounter === 0) {
				let offer = await peer.createOffer();
				console.log("--Success createOffer() in promise");
				await peer.setLocalDescription(offer);
				console.log("--Success setLocalDescription() in promise");

				// シグナリングサーバーに、行いたい接続について情報を送る
				sendSdp(peer.localDescription);

				negotiationneededCounter++;
			}
		} catch (err) {
			goErrorPage("--Failed. setLocalDescription(offer) " + err);
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
			console.log("--empty ice event");
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
	sendWsMessage(ws, roomId, side, description);
	console.log("--==Sent SDP: " + description);
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
  console.log("sending candidate=" + message);
	sendWsMessage(ws, roomId, side, message);
}

async function setAnswer(sessionDescription) {
	if (!peerConnection) {
		goErrorPage("--peerConnection not exists!");
		return;
	}
	try {
		await peerConnection.setRemoteDescription(sessionDescription);
		console.log("--Success setRemoteDescription(answer) in promise");
	} catch (err) {
		goErrorPage("--Failed. setRemoteDescription(answer) " + err);
	}
}