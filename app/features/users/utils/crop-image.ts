/**
 * 크롭 영역(픽셀)으로 이미지를 잘라 Blob으로 반환합니다.
 * react-easy-crop의 onCropComplete에서 받은 croppedAreaPixels에 사용합니다.
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => {
      console.error("이미지 로드 실패:", src, err);
      reject(new Error(`이미지 로드 실패`));
    });
    image.src = src;
  });
}

/**
 * 이미지 소스와 픽셀 크롭 영역으로 잘린 이미지 Blob을 만듭니다.
 *
 * @param imageSrc - 이미지 URL (object URL 또는 data URL)
 * @param pixelCrop - 픽셀 단위 크롭 영역 (react-easy-crop croppedAreaPixels)
 * @param mimeType - 결과 Blob의 MIME 타입 (기본: image/webp)
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  mimeType: string = "image/webp",
): Promise<Blob> {
  try {
    const image = await loadImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context를 사용할 수 없습니다.");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas에서 Blob 생성에 실패했습니다."));
          }
        },
        mimeType,
        0.95,
      );
    });
  } catch (error) {
    console.error("getCroppedImageBlob 에러:", error);
    throw error;
  }
}
