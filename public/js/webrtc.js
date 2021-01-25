let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;

export function connect() {
  console.log("--Connecting--");
  if (!peerConnection) {
    console.log("Make Offer");
    peerConnection = prepareConnection(true);
  }
  else {
    console.warn("Peer already exists.");
  }
}

function prepareConnection(isOffer) {
  const pc_config = {
		iceServers: [{ urls: "stun:stun.webrtc.ecl.ntt.com:3478" }],
	};
  const peer = new RTCPeerConnection(pc_config);

  // receiver用か? "myscreen"のところを変える必要がある
  peer.ontrack = evt => {
    console.log("-- peer.ontrack()");
    // playVideo(evt.streams[0]);
    document.getElementById("receivedScreen").srcStream = evt.streams[0];
  };

  // ICE Candidateを収集した時の処理
  peer.onicecandidate = evt => {
    if (evt.candidate) {
      console.log(evt.candidate);
    }
    else {
      console.log("Empty ice event.");
      sendSdp(peer.localDescription);
    }
  };

  // ローカルの動画ストリームをpeerに登録
  if (localStream) {
    console.log("Adding local stream...");
    localStream.getTracks().forEach(track => {
      console.log("Add a new track");
      peer.addTrack(track);
    });
  }
  else {
    console.warn("No local stream, but continue.");
  }

  peer.onnegotiationneeded = async () => {
    try {
      if (isOffer) {
        if (negotiationneededCounter === 0) {
          let offer = await peer.createOffer();
          console.log("createOffer() success in promise");
          await peer.setLocalDescription(offer);
          console.log("setLocalDescription() success in promise");
          sendSdp(peer.localDescription);
          negotiationneededCounter++;
        }
      }
    } catch (err) {
      console.error("setLocalDescription(offer) ERROR: " + err);
    }
  };

  return peer;
}

// 手動シグナリングのためのデータをWebページに表示
function sendSdp(description) {
  console.log("--Sending sdp--");
  const textForSendSdp = document.getElementById("text_for_send_sdp");
  textForSendSdp.value = description.sdp;
  textForSendSdp.focus();
  textForSendSdp.select();
}

async function makeAnswer() {
  console.log("Sending answer. Creating remote session description...");
  if (!peerConnection) {
    console.error("peerConnection doesn't exist");
    return;
  }
  try {
    let answer = await peerConnection.createAnswer();
    console.log("createAnswer() success in promise");
    await peerConnection.setLocalDescription(answer);
    console.log("setLocalDescription() success in promise");
    sendSdp(peerConnection.localDescription);
  } catch (err) {
    console.error(err);
  }
}

// Receive remote SDPボタンが押されたらOffer側とAnswer側で処理を分岐
export function onSdpText() {
    const textToReceiveSdp = document.getElementById("text_for_receive_sdp");
    const text = textToReceiveSdp.value;
    if (peerConnection) {
        console.log('Receive answer text');
        const answer = new RTCSessionDescription({
            type : 'answer',
            sdp : text,
        });
        setAnswer(answer);
    }
    else {
        console.log('Receive offer text');
        const offer = new RTCSessionDescription({
            type : 'offer',
            sdp : text,
        });
        setOffer(offer);
    }
    textToReceiveSdp.value ='';
}

// Offer側のSDPをセットする処理
async function setOffer(sessionDescription) {
    if (peerConnection) {
        console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareConnection(false);
    try{
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
        makeAnswer();
    } catch(err){
        console.error('setRemoteDescription(offer) ERROR: ', err);
    }
}

// Answer側のSDPをセットする場合
async function setAnswer(sessionDescription) {
    if (! peerConnection) {
        console.error('peerConnection doesn\'t exist!');
        return;
    }
    try{
        await peerConnection.setRemoteDescription(sessionDescription);
        console.log('setRemoteDescription(answer) succsess in promise');
    } catch(err){
        console.error('setRemoteDescription(answer) ERROR: ', err);
  }
}

export function setLocalStream(stream) {
  localStream = stream;
}