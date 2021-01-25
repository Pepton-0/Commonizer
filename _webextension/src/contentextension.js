console.log("Commonizer webextension is activated!");
document.body.style.border = "5px solid red";

document.getElementById("nativeCaller").addEventListener("click", () =>
{
  console.log("try sending: background_calling_test");
  chrome.runtime.sendMessage("background_calling_test");
});

document.getElementById("repeater").addEventListener("click", () => {
  repeat();
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_repeat") {
      console.log("Repeating");
      chrome.runtime.sendMessage("background_calling_test");
    }
  }
);

function repeat() {
  var count = 0;
  var intervalId = window.setInterval(() => {
  chrome.runtime.sendMessage("background_calling_test");
    console.log("Set the mouse position");
    count++;
    if (count > 30)
      window.clearInterval(intervalId);
  }, 3 * 1000);
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_response") {
      console.log("Received: Pong");
      sendResponse();
    }

    return true;
});