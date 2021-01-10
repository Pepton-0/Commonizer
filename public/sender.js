import { setLocalStream, connect, onSdpText } from "./webrtc.js";

window.onload = async function () {
	try {
		// SSL有効状態で成功. Chromeの場合、HTTPSじゃないとgetUserMediaを使えない.
		let mediaStream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
		});
		console.log("Succeed to acquire screen capture permission");
		console.log("The sender id is: " + window.senderId);

		let videoElement = document.getElementById("myscreen");
		videoElement.srcObject = mediaStream;
		setLocalStream(mediaStream);

		this.document.getElementById("connectButton").onclick = async function () {
			connect();
		};
		this.document.getElementById("receiveButton").onclick = async function () {
			onSdpText();
		};

		/*
    const config =
      iceServers:

          {
            urls: 'stun.l.google.com:19302'
          }
        ]
    };
    const peerConnection = new RTCPeerConnection(config);
    */
	} catch (e) {
		console.error("Unable to acquire screen capture permission: " + e);
	}
};
