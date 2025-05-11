
let imageReady = false;
let openCVReady = false;
let imgElement = null;

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
      if (openCVReady) processImage();
    };
    imgElement.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

cv['onRuntimeInitialized'] = () => {
  openCVReady = true;
  if (imageReady) processImage();
};

function processImage() {
  const canvas = document.getElementById('canvasOutput');
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let mask = new cv.Mat();

  // 轉灰階 + 二值化
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(gray, mask, 100, 255, cv.THRESH_BINARY_INV);

  // 找輪廓
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 取出 bounding boxes，並依 y 軸排序
  let boxes = [];
  for (let i = 0; i < contours.size(); ++i) {
    let rect = cv.boundingRect(contours.get(i));
    if (rect.width > 15 && rect.height > 15) {
      boxes.push(rect);
    }
  }
  boxes.sort((a, b) => a.y - b.y);  // 按垂直位置排序

  // 只遮前 N 個（預設前 10 題）
  let maxBoxes = 10;
  for (let i = 0; i < Math.min(maxBoxes, boxes.length); i++) {
    let rect = boxes[i];
    cv.rectangle(src, new cv.Point(rect.x, rect.y),
                      new cv.Point(rect.x + rect.width, rect.y + rect.height),
                      new cv.Scalar(255, 255, 255, 255), -1);
  }

  cv.imshow('canvasOutput', src);
  src.delete(); gray.delete(); mask.delete(); contours.delete(); hierarchy.delete();
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam_v3.png';
  link.href = canvas.toDataURL();
  link.click();
});
