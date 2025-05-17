const phrasesLeft = ["Detect", "Alert", "Secure"];
const phrasesRight = ["Monitor", "Prevent", "Secure"];

let currentPhraseIndexLeft = 0;
let currentCharIndexLeft = 0;
let isDeletingLeft = false;

let currentPhraseIndexRight = 0;
let currentCharIndexRight = 0;
let isDeletingRight = false;

const typewriterEl = document.getElementById("typewriter");
const typewriterRightEl = document.getElementById("typewriterRight");
const captionEl = document.getElementById("caption");
const toggleCameraBtn = document.getElementById("toggleCameraBtn");
const fileInput = document.getElementById("fileInput");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const videoFeed = document.getElementById("videoFeed");
const cameraWrapper = document.getElementById("cameraWrapper");
const resultSection = document.getElementById("resultSection");
const resultImage = document.getElementById("resultImage");
const resultLabels = document.getElementById("resultLabels");

let mediaStream = null;
let isCameraOn = false;
let detectionInterval = null;

const sirenAudio = new Audio("/static/siren.mp3");
let droneDetectionStartTime = null;
let isSirenPlaying = false;

// Left side typewriter effect
function typeWriterLeft() {
  const currentPhrase = phrasesLeft[currentPhraseIndexLeft];
  if (!isDeletingLeft) {
    if (currentCharIndexLeft < currentPhrase.length) {
      currentCharIndexLeft++;
      typewriterEl.textContent = currentPhrase.substring(0, currentCharIndexLeft);
      setTimeout(typeWriterLeft, 150);
    } else {
      isDeletingLeft = true;
      setTimeout(typeWriterLeft, 1000);
    }
  } else {
    if (currentCharIndexLeft > 0) {
      currentCharIndexLeft--;
      typewriterEl.textContent = currentPhrase.substring(0, currentCharIndexLeft);
      setTimeout(typeWriterLeft, 50);
    } else {
      isDeletingLeft = false;
      currentPhraseIndexLeft = (currentPhraseIndexLeft + 1) % phrasesLeft.length;
      setTimeout(typeWriterLeft, 150);
    }
  }
}

// Right side typewriter effect
function typeWriterRight() {
  const currentPhrase = phrasesRight[currentPhraseIndexRight];
  if (!isDeletingRight) {
    if (currentCharIndexRight < currentPhrase.length) {
      currentCharIndexRight++;
      typewriterRightEl.textContent = currentPhrase.substring(0, currentCharIndexRight);
      setTimeout(typeWriterRight, 150);
    } else {
      isDeletingRight = true;
      setTimeout(typeWriterRight, 1000);
    }
  } else {
    if (currentCharIndexRight > 0) {
      currentCharIndexRight--;
      typewriterRightEl.textContent = currentPhrase.substring(0, currentCharIndexRight);
      setTimeout(typeWriterRight, 50);
    } else {
      isDeletingRight = false;
      currentPhraseIndexRight = (currentPhraseIndexRight + 1) % phrasesRight.length;
      setTimeout(typeWriterRight, 150);
    }
  }
}

typeWriterLeft();
typeWriterRight();

// Toggle camera
async function toggleCamera() {
  if (isCameraOn) {
    stopCamera();
  } else {
    await startCamera();
  }
}

// Start camera stream and detection
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    mediaStream = stream;
    videoFeed.srcObject = stream;
    cameraWrapper.style.display = "block";
    toggleCameraBtn.textContent = "Stop Camera";
    isCameraOn = true;

    detectionInterval = setInterval(captureAndDetect, 1000);
  } catch (err) {
    alert("Could not access camera. Please grant camera permissions.");
    console.error(err);
  }
}

// Stop camera and clear results
function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  videoFeed.srcObject = null;
  cameraWrapper.style.display = "none";
  toggleCameraBtn.textContent = "Live Camera";
  isCameraOn = false;
  clearInterval(detectionInterval);
  clearDetectionResults();
  stopSiren();
}

// Clear detection UI
function clearDetectionResults() {
  resultSection.style.display = "none";
  resultImage.src = "";
  resultLabels.innerHTML = "";
}

// Play siren
function playSiren() {
  if (!isSirenPlaying) {
    sirenAudio.loop = true;
    sirenAudio.play();
    isSirenPlaying = true;
  }
}

// Stop siren
function stopSiren() {
  if (isSirenPlaying) {
    sirenAudio.pause();
    sirenAudio.currentTime = 0;
    isSirenPlaying = false;
  }
  droneDetectionStartTime = null;
}

// Capture frame and send for detection
async function captureAndDetect() {
  if (!isCameraOn || !videoFeed.videoWidth || !videoFeed.videoHeight) return;

  const canvas = document.createElement("canvas");
  canvas.width = videoFeed.videoWidth;
  canvas.height = videoFeed.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoFeed, 0, 0);

  const imageData = canvas.toDataURL("image/jpeg");

  try {
    const response = await fetch("/detect-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });
    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    if (data.image && data.labels) {
      resultImage.src = `data:image/jpeg;base64,${data.image}`;
      resultLabels.innerHTML = "";
      resultSection.style.display = "block";

      let droneDetected = data.labels.some(label => label.toLowerCase().includes("drone"));

      data.labels.forEach(label => {
        const span = document.createElement("span");
        span.textContent = label;
        span.className = "label " + (label.toLowerCase().includes("bird") ? "bird-label" : "drone-label");
        resultLabels.appendChild(span);
      });

      // Siren trigger logic
      const now = Date.now();
      if (droneDetected) {
        if (!droneDetectionStartTime) {
          droneDetectionStartTime = now;
        } else if (now - droneDetectionStartTime >= 4000) {
          playSiren();
        }
      } else {
        stopSiren();
      }

    }
  } catch (err) {
    console.error("Detection error:", err);
  }
}

// Handle file upload and detection
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  resultSection.style.display = "block";
  resultImage.src = "";
  resultLabels.innerHTML = "Processing...";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error("Upload failed with status " + response.status + ": " + text);
    }

    const data = await response.json();

    if (data.image) {
      resultImage.src = `data:image/jpeg;base64,${data.image}`;
      resultLabels.innerHTML = "";

      if (data.labels && data.labels.length > 0) {
        data.labels.forEach(label => {
          const span = document.createElement("span");
          span.textContent = label;
          span.className = "label " + (label.toLowerCase().includes("bird") ? "bird-label" : "drone-label");
          resultLabels.appendChild(span);
        });
      } else {
        resultLabels.innerHTML = "<span class='label'>No objects detected</span>";
      }
    } else if (data.error) {
      resultLabels.innerHTML = `<span class='error'>Error: ${data.error}</span>`;
    }
  } catch (err) {
    console.error("Upload detection error:", err);
    resultLabels.innerHTML = `<span class='error'>Error: ${err.message}</span>`;
  }

  event.target.value = "";
}

// Event listeners
toggleCameraBtn.addEventListener("click", toggleCamera);
uploadPhotoBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileUpload);
