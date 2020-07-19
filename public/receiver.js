import { connect, onSdpText } from "./webrtc.js";

let videoElement;

window.onload = function () {
	videoElement = document.getElementById("receivedScreen");

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
