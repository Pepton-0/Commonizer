var screenElement = document.getElementById("screen");

window.onload = function () {
	console.log("sender.js has activated.\nThe room id is: " + window.roomId);

	screenElement.addEventListener("mousedown", (e) => { console.log("mouse: down @" + e.clientX + ":" + e.clientY); });
	// TODO こちらが動かしているときだけ、あちらのマウスの座標は変更されるようにしたい. あちらの人も自分で操作したい時があるだろうから.

};