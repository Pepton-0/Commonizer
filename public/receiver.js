import { setLocalStream,connect, onSdpText } from "./webrtc.js";

let videoElement;

window.onload = async function () {

	let mediaStream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
	});
	console.log("Succeed to acquire screen capture permission");

	videoElement = document.getElementById("receivedScreen");
	document.getElementById("myscreen").srcObject = mediaStream;
	setLocalStream(mediaStream);

	// TODO 多分、こっちのconnectはいらない. 連続画像は、一方向のみの送信なので.
	this.document.getElementById("connectButton").onclick = async function () {
		connect();
	};
	this.document.getElementById("receiveButton").onclick = async function () {
		onSdpText();
	};
};

/*
function playVideo(stream) {
	videoElement.srcStream = stream;
}*/
