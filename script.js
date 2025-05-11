
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
      console.log("✅ 圖片已成功載入並繪製到 canvas");
    };
    imgElement.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

cv['onRuntimeInitialized'] = () => {
  openCVReady = true;
  console.log("✅ OpenCV.js 已完成載入");
};

document.getElementById('processBtn').addEventListener('click', () => {
  console.log("🔘 使用者按下『開始清除』按鈕");
  if (!openCVReady) {
    console.warn("⚠️ OpenCV 尚未初始化完成");
    return;
  }
  if (!imageReady) {
    console.warn("⚠️ 圖片尚未載入完成");
    return;
  }

  detectRects();
  animateErase();
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

  console.log(`📦 偵測到 ${savedRects.length} 個待遮蔽區塊`);
  src.delete(); gray.delete(); bin.delete(); contours.delete(); hierarchy.delete();
}

function animateErase(index = 0) {
  if (index >= savedRects.length) {
    console.log("✅ 所有遮蔽區塊已完成");
    return;
  }

  const canvas = document.getElementById('canvasOutput');
  const ctx = canvas.getContext('2d');

  const r = savedRects[index];
  ctx.fillStyle = "white";
  ctx.fillRect(r.x, r.y, r.width, r.height);

  setTimeout(() => animateErase(index + 1), 30);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  console.log("💾 使用者點擊下載圖片");
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam_v4_debug.png';
  link.href = canvas.toDataURL();
  link.click();
});
