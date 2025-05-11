
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    let img = new Image();
    img.onload = function() {
      const canvas = document.getElementById('canvasOutput');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 等待 OpenCV 初始化完成後處理
      if (cv && cv.imread) {
        processImage();
      } else {
        cv['onRuntimeInitialized'] = () => processImage();
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function processImage() {
  let canvas = document.getElementById('canvasOutput');
  let src = cv.imread(canvas);
  let dst = new cv.Mat();
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let rect = cv.boundingRect(cnt);
    if (rect.width > 10 && rect.height > 10) {
      cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), new cv.Scalar(255, 255, 255, 255), -1);
    }
    cnt.delete();
  }

  cv.imshow('canvasOutput', src);
  src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const canvas = document.getElementById('canvasOutput');
  const link = document.createElement('a');
  link.download = 'processed_exam.png';
  link.href = canvas.toDataURL();
  link.click();
});
