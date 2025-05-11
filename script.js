
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
    processImage();
  }
});

function processImage() {
  const canvas = document.getElementById('canvasOutput');
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let bin = new cv.Mat();

  // 灰階 + 二值化
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(gray, bin, 150, 255, cv.THRESH_BINARY_INV);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 過濾小筆跡（模擬手寫字）
  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let rect = cv.boundingRect(cnt);
    let area = rect.width * rect.height;

    if (area < 600 || rect.height < 18) {
      cv.rectangle(src, new cv.Point(rect.x, rect.y),
                        new cv.Point(rect.x + rect.width, rect.y + rect.height),
                        new cv.Scalar(255, 255, 255, 255), -1);
    }
    cnt.delete();
  }

  cv.imshow('canvasOutput', src);
  src.delete(); gray.delete(); bin.delete(); contours.delete(); hierarchy.delete();
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam_v4.png';
  link.href = canvas.toDataURL();
  link.click();
});
