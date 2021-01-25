// import { setLocalStream, connect, onSdpText } from "../webrtc.js";
import { prepareWebSocket, goErrorPage } from "/js/utility/webutil.js";

const ws = prepareWebSocket();
let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;

// Start setup for screen sharing.
window.onload = async function () {
	console.log("owner.js has activated.\nThe room id is: " + window.roomId);

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
				let offer = await peer.createOffer();
				console.log("--Success createOffer() in promise");
				await peer.setLocalDescription(offer);
				console.log("--Success setLocalDescription() in promise");

				// シグナリングサーバーに、行いたい接続について情報を送る
				//TODO ここで、app.rbにも情報を送り、sender.jsでのIDでの呼び出しにも対応できるようにした方がいいかも.
				sendSdp(peer.localDescription);

				negotiationneededCounter++;
		} catch (err) {
			console.error("--Failed. setLocalDescription(offer)", err);
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
	console.log("--==Sent SDP: " + description);

	var json = JSON.parse("{}");
	json["description"] = description;
	json["roomId"] = window.roomId;

  ws.send(JSON.stringify(json)); // TODO ここで、room_idも送りたい
}

// シグナリングサーバーに、接続手段の候補を送る
function sendIceCandidate(candidate) {
  console.log("--==Send ICE candidate");
	const message =
		JSON.stringify({ type: "candidate", ice: candidate });
  console.log("sending candidate=" + message);
  ws.send(message);
}