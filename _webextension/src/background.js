chrome.extension.onRequest.addListener(function (data, sender) {
  if (data > 0) {
    console.log("Connect");
    connect();
    sendNativeMessage(data);
  }
});

function connect() {
  chrome.runtime.connectNative("cmdrequest");
}