console.log("Commonizer webextension is activated!");
document.body.style.border = "5px solid red";

document.getElementById("nativeCaller").addEventListener("click", () => {
  console.log("Call");
  chrome.extension.sendRequest("cmdrequest");
});