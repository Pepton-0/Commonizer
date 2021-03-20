console.log("Commonizer webextension is activated!");
document.body.style.border = "5px solid red";

/*
var nativeCaller = document.getElementById("nativeCaller");
if (nativeCaller) {
  nativeCaller.addEventListener("click", () => {
    console.log("try sending: background_calling_test");
    env.runtime.sendMessage("background_calling_test");
  });
}

var repeater = document.getElementById("repeater");
if (repeater) {
  repeater.addEventListener("click", () => {
  repeat();
});
}

env.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_repeat") {
      console.log("Repeating");
      env.runtime.sendMessage("background_calling_test");
    }
  }
);

function repeat() {
  var count = 0;
  var intervalId = window.setInterval(() => {
    console.log("Set the mouse position");
    env.runtime.sendMessage("background_calling_test");
    count++;
    if (count > 5)
      window.clearInterval(intervalId);
  }, 1.5 * 1000);
}

env.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_response") {
      console.log("Received: Pong");
      sendResponse();
    }

    return true;
});*/