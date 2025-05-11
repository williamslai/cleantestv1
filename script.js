
let imageReady = false;
let openCVReady = false;
let imgElement = null;
let savedRects = [];

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    imgElement = new Image();
    imgElement.onload = function() {
      const canvas = document.getElementById('canvasOutput');
      const ctx = canvas.getContext('2d');
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);
      imageReady = true;
      savedRects = []; // reset
    };
    imgElement.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

cv['onRuntimeInitialized'] = () => {
  openCVReady = true;
};

document.getElementById('processBtn').addEventListener('click', () => {
  if (imageReady && openCVReady) {
    detectRects();
    animateErase();
  }
});

function detectRects() {
  const canvas = document.getElementById('canvasOutput');
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let bin = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(gray, bin, 150, 255, cv.THRESH_BINARY_INV);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  savedRects = [];
  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let rect = cv.boundingRect(cnt);
    let area = rect.width * rect.height;
    if (area < 600 || rect.height < 18) {
      savedRects.push(rect);
    }
    cnt.delete();
  }

  src.delete(); gray.delete(); bin.delete(); contours.delete(); hierarchy.delete();
}

function animateErase(index = 0) {
  if (index >= savedRects.length) return;

  const canvas = document.getElementById('canvasOutput');
  const ctx = canvas.getContext('2d');

  const r = savedRects[index];
  ctx.fillStyle = "white";
  ctx.fillRect(r.x, r.y, r.width, r.height);

  setTimeout(() => animateErase(index + 1), 30); // 每格 30ms
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam_v4_animated.png';
  link.href = canvas.toDataURL();
  link.click();
});
