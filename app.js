let video = document.getElementById('video');
let preview = document.getElementById('preview');
let cameraSelect = document.getElementById('cameraSelect');
let countdownEl = document.getElementById('countdown');
let photoArray = [];
let currentStream = null;
let currentFacingMode = 'user';
let deviceList = [];

navigator.mediaDevices.enumerateDevices().then(devices => {
  deviceList = devices.filter(device => device.kind === 'videoinput');
  cameraSelect.innerHTML = '';
  deviceList.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = device.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });
  if (deviceList.length > 0) {
    startCamera(deviceList[0].deviceId);
  }
});

function startCamera(deviceIdOrFacingMode) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  let constraints;
  if (typeof deviceIdOrFacingMode === 'string' && deviceIdOrFacingMode.length > 20) {
    constraints = { video: { deviceId: { exact: deviceIdOrFacingMode } } };
  } else {
    constraints = { video: { facingMode: deviceIdOrFacingMode } };
  }

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      video.play();
      video.style.transform = (deviceIdOrFacingMode === 'user' || currentFacingMode === 'user') ? 'scaleX(-1)' : 'scaleX(1)';
    })
    .catch(err => {
      alert('Camera access error: ' + err.message);
    });
}

function switchCamera(deviceId) {
  startCamera(deviceId);
}

function toggleCamera() {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  startCamera(currentFacingMode);
}

function takePhoto() {
  let count = 3;
  countdownEl.textContent = count;
  countdownEl.style.display = 'flex';

  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      countdownEl.style.display = 'none';

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (video.style.transform === 'scaleX(-1)') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);
      const photo = canvas.toDataURL('image/png');
      photoArray.push(photo);
      updatePreview();
    } else {
      countdownEl.textContent = count;
    }
  }, 1000);
}

function undoPhoto() {
  photoArray.pop();
  updatePreview();
}

function updatePreview() {
  preview.innerHTML = '';
  photoArray.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo;
    preview.appendChild(img);
  });
}

function handleDownload(option) {
  if (option === "photo1" && photoArray[0]) downloadPhoto(photoArray[0], "photo1.png");
  else if (option === "photo2" && photoArray[1]) downloadPhoto(photoArray[1], "photo2.png");
  else if (option === "photo3" && photoArray[2]) downloadPhoto(photoArray[2], "photo3.png");
  else if (option === "strip") createAndDownloadStrip();
  document.getElementById("downloadOptions").value = "";
}

function downloadPhoto(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function createAndDownloadStrip() {
  if (photoArray.length < 3) {
    alert("Take 3 photos first to download the strip.");
    return;
  }

  const imgs = photoArray.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  Promise.all(imgs.map(img => new Promise(res => img.onload = res))).then(() => {
    const width = imgs[0].width;
    const height = imgs[0].height;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height * 3;
    const ctx = canvas.getContext("2d");

    imgs.forEach((img, i) => ctx.drawImage(img, 0, i * height));

    const finalStrip = canvas.toDataURL("image/png");
    downloadPhoto(finalStrip, "photolian_strip.png");
  });
}
