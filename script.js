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
  console.log("OpenCV.js 已載入完成");
  openCVReady = true;
  if (imageReady) processImage();
};

function processImage() {
  const canvas = document.getElementById('canvasOutput');
  let src = cv.imread(canvas);
  let dst = new cv.Mat();

  // 轉灰階 + 模糊
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

  // 偵測輪廓
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 清除（塗白）答案區域
  for (let i = 0; i < contours.size(); ++i) {
    let rect = cv.boundingRect(contours.get(i));
    if (rect.width > 15 && rect.height > 15) {
      cv.rectangle(src, new cv.Point(rect.x, rect.y),
                        new cv.Point(rect.x + rect.width, rect.y + rect.height),
                        new cv.Scalar(255, 255, 255, 255), -1);
    }
  }

  cv.imshow('canvasOutput', src);

  // 釋放記憶體
  src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam.png';
  link.href = canvas.toDataURL();
  link.click();
});
