import { setLocalStream, connect, onSdpText } from "./webrtc.js";

let videoElement;

window.onload = async function () {
	let mediaStream = await navigator.mediaDevices.getDisplayMedia({
		video: true,
	});
	console.log("Succeed to acquire screen capture permission");

	videoElement = document.getElementById("receivedScreen");
	document.getElementById("myscreen").srcObject = mediaStream;
	setLocalStream(mediaStream);
	videoElement.addEventListener("click", (e) => {});
	videoElement.get;

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
}
let mycanvas;
let graphic;
var isDragging = false;

window.onload = function () {
	mycanvas = this.document.getElementById("mycanvas");
	graphic = mycanvas.getContext("2d");

	mycanvas.addEventListener("mousedown", (e) => {isDragging = true;});
	mycanvas.addEventListener("touchstart", (e) => {isDragging = true;});

	mycanvas.addEventListener("mousemove", (e) => {
		if (isDragging) redraw(e.clientX, e.clientY);
	});
	mycanvas.addEventListener("touchmove", (e) => {
		if (isDragging) redraw(e.touches[0].clientX, e.touches[0].clientY);
	});

	mycanvas.addEventListener("mouseup", (e) => {
		isDragging = false;
		graphic.clearRect(0, 0, mycanvas.width, mycanvas.height);
	});
	mycanvas.addEventListener("touchend", (e) => {
		isDragging = false;
		graphic.clearRect(0, 0, mycanvas.width, mycanvas.height);
	});
};

function redraw(posX, posY) {
	graphic.clearRect(0, 0, mycanvas.width, mycanvas.height);
	graphic.beginPath();
	graphic.arc(posX, posY, 10, 0, Math.PI * 2, false);
	graphic.fill();
}*/
