console.log("Start background.js");
//var port = browser.runtime.connectNative("native_test");
//Where: HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\commonizer_webextension
var port = browser.runtime.connectNative("commonizer_webextension");

browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("received something");
    if (request == "background_calling_test") {
      console.log("--Received: background_calling_test");
      console.log("--"+request);
      console.log("--"+sender);
      sendResponse();
      console.log("--try sending: contentextension_calling_response");
      browser.tabs.sendMessage(sender.tab.id,"contentextension_calling_response");
      console.log("--Try sending native message");

      port.postMessage({
        "order": "set_mouse_ratio",
        "x_ratio": "0.5",
        "y_ratio": "0.1"});
      port.postMessage({ "order": "test" });
    }
    else {
      var json = JSON.parse(request);
      if (json) {
        if (json["order"] == "set_mouse_ratio") {
          console.log("--Received: set_mouse_ratio");
          sendResponse();
          port.postMessage({
            "order": "set_mouse_ratio",
            "x_ratio": json["x_ratio"],
            "y_ratio": json["y_ratio"]
          });
        }
        else if (json["order"] == "mouse_down") {
          console.log("--Received: mouse_down");
          sendResponse();
          port.postMessage({
            "order": "mouse_down",
            "number": json["number"]
          });
        }
        else if (json["order"] == "mouse_up") {
          console.log("--Received: mouse_down");
          sendResponse();
          port.postMessage({
            "order": "mouse_up",
            "number": json["number"]
          });
        }
        else if (json["order"] == "key_down") {
          console.log("--Received: key_down");
          sendResponse();
          port.postMessage({
            "order": "key_down",
            "keycode":json["keycode"]
          });
        }
        else if (json["order"] == "key_up") {
          console.log("--Received: key_up");
          sendResponse();
          port.postMessage({
            "order": "key_up",
            "keycode":json["keycode"]
          });
        }
      }
    }
    return true;
  }
);

port.onMessage.addListener((response) => {
  console.log("--Received: " + response);
  console.log("--Received JSON: " + JSON.stringify(response));
});