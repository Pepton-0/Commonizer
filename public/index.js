/*
window.onload = function () {
	// SSL有効状態で成功. Chromeの場合、HTTPSじゃないとgetUserMediaを使えない.
	this.document.getElementById("shareButton").onclick = async function () {
		try {
			let mediaStream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
			});
			let videoElement = document.getElementById("myscreen");
			videoElement.srcObject = mediaStream;
			console.log("Succeed to acquire screen capture");
		} catch (e) {
			console.log("Unable to acquire screen capture: " + e);
		}
	};
};*/