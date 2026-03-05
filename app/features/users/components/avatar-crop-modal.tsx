/**
 * 아바타 이미지 크롭 모달
 *
 * react-easy-crop로 영역을 선택한 뒤, 확인 시 잘린 이미지를 Blob으로 반환합니다.
 * 업로드/압축은 부모(폼)에서 처리합니다.
 */
import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import { Button } from "~/core/components/ui/button";

import { getCroppedImageBlob, type PixelCrop } from "../utils/crop-image";

import "react-easy-crop/react-easy-crop.css";

const CROP_AREA_HEIGHT = 320;

export interface AvatarCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropModal({
  open,
  imageSrc,
  onConfirm,
  onCancel,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const lastCroppedPixels = useRef<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    lastCroppedPixels.current = croppedAreaPixels;
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !lastCroppedPixels.current) return;
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        lastCroppedPixels.current as PixelCrop,
      );
      onConfirm(blob);
    } catch (error) {
      console.error("크롭 이미지 생성 실패:", error);
      // 에러를 부모로 전달하지 않고 여기서 처리
      alert(
        `이미지 크롭에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      );
    }
  }, [imageSrc, onConfirm]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onCancel();
    },
    [onCancel],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          onCancel();
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>이미지 영역 선택</DialogTitle>
        </DialogHeader>

        <div
          className="relative w-full bg-black/10"
          style={{ height: CROP_AREA_HEIGHT }}
        >
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={0}
              aspect={1}
              minZoom={1}
              maxZoom={3}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              style={{
                containerStyle: {},
                cropAreaStyle: {},
                mediaStyle: {},
              }}
              classes={{
                containerClassName: "",
                cropAreaClassName: "",
                mediaClassName: "",
              }}
              mediaProps={{}}
              cropperProps={{}}
              restrictPosition
              zoomSpeed={1}
              keyboardStep={0.1}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">확대</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" onClick={handleConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
