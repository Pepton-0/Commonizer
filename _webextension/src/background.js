console.log("Start background.js");
//var port = chrome.runtime.connectNative("native_test");
//Where: HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\commonizer_webextension
var port = chrome.runtime.connectNative("commonizer_webextension");

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request == "background_calling_test") {
      console.log("Received: background_calling_test");
      console.log(request);
      console.log(sender);
      sendResponse();
      console.log("try sending: contentextension_calling_response");
      chrome.tabs.sendMessage(sender.tab.id,"contentextension_calling_response");
      // chrome.extension.sendRequest("cmdrequest");
      //port.postMessage("ping");
      console.log("Try sending native message");
      port.postMessage({ "text": "mouse_pos" });
      port.postMessage({ "text": "ping"});
    }
    return true;
  }
);

port.onMessage.addListener((response) => {
  console.log("Received: " + response);
  console.log("Received JSON: " + JSON.stringify(response));
});


/*
document.getElementById("nativeCaller").addEventListener("click", () => {
  console.log("Call: Ping");
  // chrome.extension.sendRequest("cmdrequest");
  port.postMessage("ping");
});

port.onMessage.addListener((response) => {
  console.log("Received: " + response);
});*/