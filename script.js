const i18n = {
  km: {
    brandSub: "រូបភាព • ជជែក", tabPhotos: "រូបភាព", tabText: "អក្សរ", tabVoice: "សំឡេង",
    emptyText: "មិនទាន់មាន Post ទេ",
    captionPh: "សរសេរអ្វីមួយជាមួយរូបភាព...", choose: "🖼️ ជ្រើសរូប", camera: "📷 ថត", post: "📤 Post",
    delete: "លុប",
    textTitleIdle: "រកមិត្តជជែកជាអក្សរ", voiceTitleIdle: "រកមិត្តជជែកសំឡេង",
    idleStatus: "ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់ផ្តើម",
    searching: "កំពុងស្វែងរកដៃគូ...",
    connected: "បានភ្ជាប់! និយាយសួស្តីទៅ 👋",
    partnerLeft: "ដៃគូបានចាកចេញ។ ចុច \"រកថ្មី\" ដើម្បីបន្ត",
    findBtn: "ស្វែងរកឥឡូវនេះ", nextBtn: "រកថ្មី", leaveBtn: "ចាកចេញ",
    micOn: "🎤 បើកសំឡេង", micOff: "🔇 បិទសំឡេង",
    chatPh: "វាយសាររបស់អ្នក...", send: "ផ្ញើ",
    micDenied: "មិនអាចប្រើមីក្រូហ្វូនបានទេ សូមអនុញ្ញាតសិន",
    camDenied: "មិនអាចចូលប្រើកាមេរ៉ាបានទេ",
    needImage: "សូមជ្រើស ឬថតរូបជាមុនសិន",
    confirmDelete: "លុប Post នេះ?",
    systemJoinYou: "អ្នកបានចូលរួម",
  },
  en: {
    brandSub: "Photos • Chat", tabPhotos: "Photos", tabText: "Text", tabVoice: "Voice",
    emptyText: "No posts yet",
    captionPh: "Write something with your photo...", choose: "🖼️ Choose", camera: "📷 Camera", post: "📤 Post",
    delete: "Delete",
    textTitleIdle: "Find a text chat partner", voiceTitleIdle: "Find a voice chat partner",
    idleStatus: "Tap the button below to start",
    searching: "Looking for a partner...",
    connected: "Connected! Say hi 👋",
    partnerLeft: "Your partner left. Tap \"Next\" to continue",
    findBtn: "Find now", nextBtn: "Next", leaveBtn: "Leave",
    micOn: "🎤 Unmute", micOff: "🔇 Mute",
    chatPh: "Type your message...", send: "Send",
    micDenied: "Couldn't access microphone, please allow it",
    camDenied: "Could not access camera",
    needImage: "Choose or take a photo first",
    confirmDelete: "Delete this post?",
    systemJoinYou: "You joined",
  }
};

let lang = "km";
let theme = "light";
let posts = [];
let selectedFile = null;
let camStream = null;
let facing = "user";

const $ = id => document.getElementById(id);
const socket = io();

// ============================================================
// LANGUAGE / THEME
// ============================================================
function applyLang() {
  const t = i18n[lang];
  $("brandSub").textContent = t.brandSub;
  $("tabPhotos").textContent = t.tabPhotos;
  $("tabText").textContent = t.tabText;
  $("tabVoice").textContent = t.tabVoice;
  $("emptyText").textContent = t.emptyText;
  $("captionInput").placeholder = t.captionPh;
  $("choosePostBtn").textContent = t.choose;
  $("cameraPostBtn").textContent = t.camera;
  $("postBtn").textContent = t.post;
  $("chatInput").placeholder = t.chatPh;
  $("sendBtn").textContent = t.send;
  $("textFindBtn").textContent = t.findBtn;
  $("textNextBtn").textContent = t.nextBtn;
  $("textLeaveBtn").textContent = t.leaveBtn;
  $("voiceFindBtn").textContent = t.findBtn;
  $("voiceNextBtn").textContent = t.nextBtn;
  $("voiceLeaveBtn").textContent = t.leaveBtn;
  $("langBtn").textContent = lang === "km" ? "KM" : "EN";
  if (!textState.matched && !textState.searching) $("textStatusTitle").textContent = t.textTitleIdle;
  if (!voiceState.matched && !voiceState.searching) $("voiceStatusTitle").textContent = t.voiceTitleIdle;
  if (!textState.matched && !textState.searching) $("textStatus").textContent = t.idleStatus;
  if (!voiceState.matched && !voiceState.searching) $("voiceStatus").textContent = t.idleStatus;
  $("voiceMuteBtn").textContent = voiceState.muted ? t.micOff : t.micOn;
  renderPosts();
}

$("langBtn").onclick = () => { lang = lang === "km" ? "en" : "km"; applyLang(); };

$("themeBtn").onclick = () => {
  theme = theme === "light" ? "dark" : "light";
  document.body.dataset.theme = theme;
  $("themeBtn").textContent = theme === "light" ? "🌙" : "☀️";
};

// ============================================================
// TABS
// ============================================================
document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    tab.classList.add("active");
    $("view-" + tab.dataset.view).classList.add("active");
  };
});

// ============================================================
// API HELPER
// ============================================================
async function api(url, options = {}) {
  const response = await fetch(url, options);
  let data = {};
  try { data = await response.json(); } catch (e) {}
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ============================================================
// PHOTOS
// ============================================================
async function loadPosts() {
  try { posts = await api("/api/posts"); }
  catch (e) { console.error(e); posts = []; }
  renderPosts();
}

function renderPosts() {
  const grid = $("photoGrid");
  grid.innerHTML = "";
  $("emptyState").style.display = posts.length ? "none" : "block";

  posts.forEach(post => {
    const cell = document.createElement("div");
    cell.className = "cell";

    const img = document.createElement("img");
    img.src = post.imageUrl;
    cell.appendChild(img);

    if (post.caption) {
      const cap = document.createElement("div");
      cap.className = "cap";
      cap.textContent = post.caption;
      cell.appendChild(cap);
    }

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.onclick = async () => {
      if (!confirm(i18n[lang].confirmDelete)) return;
      try { await api("/api/posts/" + post.id, { method: "DELETE" }); await loadPosts(); }
      catch (e) { alert(e.message); }
    };
    cell.appendChild(del);

    grid.appendChild(cell);
  });
}

function setSelectedFile(file) {
  selectedFile = file;
  if (file) {
    $("selectedPreview").src = URL.createObjectURL(file);
    $("selectedPreviewWrap").style.display = "block";
  } else {
    $("selectedPreviewWrap").style.display = "none";
  }
}

$("choosePostBtn").onclick = () => $("fileInput").click();
$("fileInput").onchange = e => {
  setSelectedFile(e.target.files[0] || null);
  e.target.value = "";
};
$("clearSelected").onclick = () => setSelectedFile(null);

$("postBtn").onclick = async () => {
  if (!selectedFile) { alert(i18n[lang].needImage); return; }
  try {
    $("postBtn").disabled = true;
    const form = new FormData();
    form.append("image", selectedFile);
    form.append("caption", $("captionInput").value.trim());
    await api("/api/posts", { method: "POST", body: form });
    setSelectedFile(null);
    $("captionInput").value = "";
    await loadPosts();
  } catch (e) { alert(e.message); }
  finally { $("postBtn").disabled = false; }
};

// ============================================================
// CAMERA
// ============================================================
$("cameraPostBtn").onclick = openCamera;
async function openCamera() {
  $("cameraOverlay").classList.add("open");
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
    $("cameraVideo").srcObject = camStream;
  } catch (e) {
    alert(i18n[lang].camDenied);
    closeCamera();
  }
}
function closeCamera() {
  $("cameraOverlay").classList.remove("open");
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
}
$("camClose").onclick = closeCamera;
$("camFlip").onclick = async () => {
  facing = facing === "user" ? "environment" : "user";
  if (camStream) camStream.getTracks().forEach(t => t.stop());
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
    $("cameraVideo").srcObject = camStream;
  } catch (e) {}
};
$("camShutter").onclick = () => {
  const video = $("cameraVideo");
  const canvas = $("captureCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    setSelectedFile(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
    closeCamera();
  }, "image/jpeg", 0.85);
};

// ============================================================
// TEXT CHAT — real matching via socket.io
// ============================================================
const textState = { searching: false, matched: false };

function addMsg(container, text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

$("textFindBtn").onclick = () => {
  textState.searching = true;
  $("chatMessages").innerHTML = "";
  $("textChatBox").style.display = "none";
  $("textRing").classList.add("pulsing");
  $("textStatusTitle").textContent = i18n[lang].searching;
  $("textStatus").textContent = "";
  $("textFindBtn").style.display = "none";
  $("textLeaveBtn").style.display = "inline-block";
  socket.emit("find", "text");
};

$("textNextBtn").onclick = () => {
  textState.matched = false;
  $("chatMessages").innerHTML = "";
  $("textChatBox").style.display = "none";
  $("textRing").classList.add("pulsing");
  $("textStatusTitle").textContent = i18n[lang].searching;
  $("textNextBtn").style.display = "none";
  socket.emit("next");
};

$("textLeaveBtn").onclick = () => {
  textState.searching = false;
  textState.matched = false;
  socket.emit("leave");
  resetTextUI();
};

function resetTextUI() {
  $("textRing").classList.remove("pulsing");
  $("textStatusTitle").textContent = i18n[lang].textTitleIdle;
  $("textStatus").textContent = i18n[lang].idleStatus;
  $("textFindBtn").style.display = "inline-block";
  $("textNextBtn").style.display = "none";
  $("textLeaveBtn").style.display = "none";
  $("textChatBox").style.display = "none";
}

$("sendBtn").onclick = sendTextMsg;
$("chatInput").onkeydown = e => { if (e.key === "Enter") sendTextMsg(); };
function sendTextMsg() {
  const val = $("chatInput").value.trim();
  if (!val || !textState.matched) return;
  addMsg($("chatMessages"), val, "me");
  socket.emit("chat-message", val);
  $("chatInput").value = "";
}

// ============================================================
// VOICE CHAT — real matching via socket.io + WebRTC
// ============================================================
const voiceState = { searching: false, matched: false, muted: false, initiator: false };
let pc = null;
let localAudioStream = null;

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

$("voiceFindBtn").onclick = async () => {
  try {
    localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert(i18n[lang].micDenied);
    return;
  }
  voiceState.searching = true;
  $("voiceRing").classList.add("pulsing");
  $("voiceStatusTitle").textContent = i18n[lang].searching;
  $("voiceStatus").textContent = "";
  $("voiceFindBtn").style.display = "none";
  $("voiceLeaveBtn").style.display = "inline-block";
  socket.emit("find", "voice");
};

$("voiceNextBtn").onclick = () => {
  teardownPeerConnection();
  voiceState.matched = false;
  $("voiceRing").classList.add("pulsing");
  $("voiceStatusTitle").textContent = i18n[lang].searching;
  $("voiceNextBtn").style.display = "none";
  $("voiceMuteBtn").style.display = "none";
  socket.emit("next");
};

$("voiceLeaveBtn").onclick = () => {
  voiceState.searching = false;
  voiceState.matched = false;
  socket.emit("leave");
  teardownPeerConnection();
  stopLocalAudio();
  resetVoiceUI();
};

$("voiceMuteBtn").onclick = () => {
  if (!localAudioStream) return;
  voiceState.muted = !voiceState.muted;
  localAudioStream.getAudioTracks().forEach(t => t.enabled = !voiceState.muted);
  $("voiceMuteBtn").textContent = voiceState.muted ? i18n[lang].micOff : i18n[lang].micOn;
};

function stopLocalAudio() {
  if (localAudioStream) { localAudioStream.getTracks().forEach(t => t.stop()); localAudioStream = null; }
}

function resetVoiceUI() {
  $("voiceRing").classList.remove("pulsing");
  $("voiceStatusTitle").textContent = i18n[lang].voiceTitleIdle;
  $("voiceStatus").textContent = i18n[lang].idleStatus;
  $("voiceFindBtn").style.display = "inline-block";
  $("voiceNextBtn").style.display = "none";
  $("voiceLeaveBtn").style.display = "none";
  $("voiceMuteBtn").style.display = "none";
  voiceState.muted = false;
}

function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  localAudioStream.getTracks().forEach(track => pc.addTrack(track, localAudioStream));

  pc.ontrack = (event) => {
    $("remoteAudio").srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { type: "candidate", candidate: event.candidate });
    }
  };
}

async function startAsInitiator() {
  createPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("signal", { type: "offer", sdp: offer });
}

function teardownPeerConnection() {
  if (pc) { pc.close(); pc = null; }
  $("remoteAudio").srcObject = null;
}

socket.on("signal", async (data) => {
  if (!voiceState.matched) return;
  try {
    if (data.type === "offer") {
      if (!pc) createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", { type: "answer", sdp: answer });
    } else if (data.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === "candidate") {
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (e) { console.error("signal error", e); }
});

// ============================================================
// SOCKET EVENTS SHARED BY TEXT + VOICE
// ============================================================
socket.on("matched", async ({ mode, initiator }) => {
  if (mode === "text") {
    textState.searching = false;
    textState.matched = true;
    $("textRing").classList.remove("pulsing");
    $("textStatusTitle").textContent = i18n[lang].connected;
    $("textStatus").textContent = "";
    $("textNextBtn").style.display = "inline-block";
    $("textLeaveBtn").style.display = "inline-block";
    $("textChatBox").style.display = "flex";
    $("chatMessages").innerHTML = "";
  }
  if (mode === "voice") {
    voiceState.searching = false;
    voiceState.matched = true;
    voiceState.initiator = initiator;
    $("voiceRing").classList.remove("pulsing");
    $("voiceStatusTitle").textContent = i18n[lang].connected;
    $("voiceStatus").textContent = "";
    $("voiceNextBtn").style.display = "inline-block";
    $("voiceLeaveBtn").style.display = "inline-block";
    $("voiceMuteBtn").style.display = "inline-block";
    if (initiator) await startAsInitiator();
  }
});

socket.on("chat-message", (text) => {
  addMsg($("chatMessages"), text, "them");
});

socket.on("partner-left", () => {
  if (textState.matched) {
    textState.matched = false;
    addMsg($("chatMessages"), i18n[lang].partnerLeft, "system");
    $("textStatusTitle").textContent = i18n[lang].partnerLeft;
    $("textNextBtn").style.display = "inline-block";
  }
  if (voiceState.matched) {
    voiceState.matched = false;
    teardownPeerConnection();
    $("voiceStatusTitle").textContent = i18n[lang].partnerLeft;
    $("voiceStatus").textContent = "";
    $("voiceNextBtn").style.display = "inline-block";
    $("voiceMuteBtn").style.display = "none";
  }
});

// ============================================================
// START
// ============================================================
applyLang();
loadPosts();
