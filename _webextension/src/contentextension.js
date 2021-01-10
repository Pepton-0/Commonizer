console.log("Commonizer webextension is activated!");
document.body.style.border = "5px solid red";

document.getElementById("nativeCaller").addEventListener("click", () =>
{
  console.log("try sending: background_calling_test");
  chrome.runtime.sendMessage("background_calling_test");
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_response") {
      console.log("Received: Pong");
      sendResponse();
    }

    return true;
});