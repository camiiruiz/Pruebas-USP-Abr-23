import cv, { CV_8UC1, CV_8U } from "@techstark/opencv-js";

export function processImage(img) {
  const original = img;
  const newImg = new cv.Mat();
  let image2 = original.clone();

  cv.cvtColor(image2, newImg, cv.COLOR_RGBA2RGB,0);
  cv.cvtColor(newImg, newImg, cv.COLOR_RGB2HSV,0);

  let centro = new cv.Point(100,100);
  let mask = new cv.Mat.zeros(200,200,CV_8U);
  cv.circle(mask, centro, 50, [1,1,1,0], cv.FILLED);
  
  let media = cv.mean(newImg,mask);
  let H = Math.round(media[0]);
  console.log(media);

  cv.circle(image2,centro,50,[255,0,0,1], 3); // Dibujo el ciruclo en el medio
  
  return {
    image: image2,
    croppedImage: original,
    detectedPixels: Math.round(H),
  };

}

// returns true if every pixel's uint32 representation is 0 (or "blank")
export function  isCanvasBlank(canvas) {
  const context = canvas.getContext('2d');

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  return !pixelBuffer.some(color => color !== 0);
}
