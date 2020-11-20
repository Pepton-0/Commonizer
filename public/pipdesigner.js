let pipWindow;
const videoSource = document.getElementById("local_video");
const toggleButton = document.getElementById("pipToggle");

// TODO 現在、PIPがFirefoxでしか動作しない。(disabledとかがFirefoxにしか無いため)
window.onload = function () {
	console.log("startup");
	/* Feature support */
	toggleButton.addEventListener("click", async function (event) {
		console.log("Toggling Picture-in-Picture");
		toggleButton.disabled = true;
		try {
			if (videoSource != document.pictureInPictureElement)
				await videoSource.requestPictureInPicture();
			else await document.exitPictureInPicture();
		} catch (error) {
			console.log(error);
		} finally {
			toggleButton.disabled = false;
		}
	});

	if ("pictureInPictureEnabled" in document) {
		console.log("show toggle button");
		// Set button ability depending on whether Picture-in-Picture can be used.
		setToggleButton();
		videoSource.addEventListener("loadedmetadata", setToggleButton);
		videoSource.addEventListener("emptied", setToggleButton);
	} else {
		// Hide button if Picture-in-Picture is not supported.
		console.log("hide toggle button");
		toggleButton.hidden = true;
	}

	// Note that this can happen if user clicked the "Toggle Picture-in-Picture"
	// button but also if user clicked some browser context menu or if
	// Picture-in-Picture was triggered automatically for instance.
	videoSource.addEventListener("enterpictureinpicture", function (event) {
		console.log("> Video entered Picture-in-Picture");

		pipWindow = event.pictureInPictureWindow;
		console.log(`> Window size is ${pipWindow.width}x${pipWindow.height}`);

		pipWindow.addEventListener("resize", onPipWindowResize);
	});

	videoSource.addEventListener("leavepictureinpicture", function () {
		console.log("> Video left Picture-in-Picture");

		pipWindow.removeEventListener("resize", onPipWindowResize);
	});
};

function onPipWindowResize() {
	console.log(
		`> Window size changed to ${pipWindow.width}x${pipWindow.height}`
	);
}

function setToggleButton() {
	toggleButton.disabled =
		videoSource.readyState === 0 ||
		!document.pictureInPictureEnabled ||
		videoSource.disablePictureInPicture;
}
