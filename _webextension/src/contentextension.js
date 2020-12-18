console.log("Commonizer webextension is activated!");
document.body.style.border = "5px solid red";

document.getElementById("nativeCaller").addEventListener("click", () => {
  chrome.runtime.sendMessage("background_calling_test",
    function (response) {
      console.log("Sent message");
    }
  );
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "contentextension_calling_response") {
      console.log("Respond: Pong");
    }
});