var port = chrome.runtime.connectNative("native_test");

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "background_calling_test") {
      console.log(request);
      console.log(sender);
      console.log(sendResponse);
      console.log("Call: Ping");
      chrome.runtime.sendMessage("contentextension_calling_response", function () { console.log("Resond"); });
      // chrome.extension.sendRequest("cmdrequest");
      port.postMessage("ping");
    }
  }
);

/*
document.getElementById("nativeCaller").addEventListener("click", () => {
  console.log("Call: Ping");
  // chrome.extension.sendRequest("cmdrequest");
  port.postMessage("ping");
});

port.onMessage.addListener((response) => {
  console.log("Received: " + response);
});*/