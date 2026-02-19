/**
 * 이미지 업로드 유틸리티
 *
 * 클라이언트 사이드에서 이미지를 압축하고 webp 형식으로 변환하는 함수들을 제공합니다.
 * browser-image-compression을 사용하여 이미지를 최적화합니다.
 */
import imageCompression from "browser-image-compression";

/**
 * 이미지 압축 옵션
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // 최대 파일 크기 (MB)
  maxWidthOrHeight: 1600, // 최대 너비 또는 높이
  useWebWorker: true, // 웹 워커 사용 (성능 향상)
  quality: 0.85, // 이미지 품질 (0-1)
  fileType: "image/webp" as const, // webp 형식으로 변환
};

/**
 * 이미지 파일을 webp 형식으로 압축합니다.
 *
 * @param file - 압축할 이미지 파일
 * @returns 압축된 webp 형식의 File 객체
 * @throws 이미지 압축 실패 시 에러
 */
export async function compressImageToWebp(
  file: File,
): Promise<File> {
  try {
    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 압축할 수 있습니다.");
    }

    // browser-image-compression으로 압축 및 webp 변환
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

    // webp 형식으로 변환되었는지 확인
    if (compressedFile.type !== "image/webp") {
      // webp로 변환되지 않은 경우, 이름만 변경
      return new File([compressedFile], compressedFile.name.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
        lastModified: compressedFile.lastModified,
      });
    }

    return compressedFile;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`이미지 압축 실패: ${error.message}`);
    }
    throw new Error("이미지 압축 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 파일 크기 검증
 *
 * @param file - 검증할 파일
 * @param maxSizeMB - 최대 크기 (MB)
 * @returns 파일 크기가 유효한지 여부
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일인지 확인
 *
 * @param file - 확인할 파일
 * @returns 이미지 파일인지 여부
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
