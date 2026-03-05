import { type Route } from "@rr/app/features/users/api/+types/edit-profile";
import { UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import FetcherFormButton from "~/core/components/fetcher-form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

import {
  AVATAR_COMPRESSION_OPTIONS,
  compressImageToWebp,
  isImageFile,
  validateFileSize,
} from "../../../admin/utils/image-upload";

import { AvatarCropModal } from "../avatar-crop-modal";

const MAX_AVATAR_SIZE_MB = 3;

export default function EditProfileForm({
  name,
  avatarUrl,
  marketingConsent,
}: {
  name: string;
  marketingConsent: boolean;
  avatarUrl: string | null;
}) {
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState<string | null>(null);

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
  }, [fetcher.data]);

  // 파일 선택 시 검증만 하고 크롭 모달을 연다 (업로드용 파일 설정은 크롭 확인 후 수행)
  const onChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setAvatarError("이미지 파일만 업로드할 수 있습니다.");
      setAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!validateFileSize(file, MAX_AVATAR_SIZE_MB)) {
      setAvatarError(
        "이미지 용량이 3MB를 초과했습니다. 이미지 용량을 다시 확인해주세요.",
      );
      setAvatar(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (pendingCropImage) URL.revokeObjectURL(pendingCropImage);
    setPendingCropImage(URL.createObjectURL(file));
    setCropModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!fileInputRef.current || !pendingCropImage) return;

    try {
      // getCroppedImageBlob에서 이미 webp로 반환하므로 File로 변환
      const croppedFile = new File([blob], "avatar.webp", {
        type: "image/webp",
      });

      // 크롭된 이미지를 아바타용으로 압축
      const compressedFile = await compressImageToWebp(
        croppedFile,
        AVATAR_COMPRESSION_OPTIONS,
      );

      // 압축 후 용량 체크
      if (!validateFileSize(compressedFile, MAX_AVATAR_SIZE_MB)) {
        setAvatarError(
          "압축된 이미지 용량이 3MB를 초과했습니다. 더 작은 영역을 선택해주세요.",
        );
        setAvatar(null);
        URL.revokeObjectURL(pendingCropImage);
        setPendingCropImage(null);
        setCropModalOpen(false);
        return;
      }

      // 폼 input에 압축된 파일 설정
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressedFile);
      fileInputRef.current.files = dataTransfer.files;

      // 미리보기 갱신
      setAvatar(URL.createObjectURL(compressedFile));
      setAvatarError(null);
    } catch (error) {
      console.error("아바타 처리 오류:", error);
      setAvatarError(
        `이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      );
      setAvatar(null);
    } finally {
      URL.revokeObjectURL(pendingCropImage);
      setPendingCropImage(null);
      setCropModalOpen(false);
    }
  };

  const handleCropCancel = () => {
    if (pendingCropImage) URL.revokeObjectURL(pendingCropImage);
    setPendingCropImage(null);
    setCropModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <fetcher.Form
      method="post"
      className="w-full max-w-screen-md"
      encType="multipart/form-data"
      ref={formRef}
      action="/api/users/profile"
    >
      <Card className="justify-between">
        <CardHeader className="mb-8">
          <CardTitle className="text-h5">프로필 수정</CardTitle>
          <CardDescription>
            프로필 정보를 보거나 수정할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full flex-col gap-7">
            <div className="flex flex-col items-center gap-4">
              <Label
                htmlFor="avatar"
                className="flex flex-col items-start gap-2"
              >
                <Avatar className="size-32 cursor-pointer bg-gray-500 xl:size-44">
                  {avatar ? (
                    <AvatarImage
                      className="h-full w-full object-cover"
                      src={avatar}
                      alt="Avatar"
                    />
                  ) : null}
                  <AvatarFallback>
                    <UserIcon className="text-muted-foreground size-10" />
                  </AvatarFallback>
                </Avatar>
              </Label>
              <div className="text-muted-foreground flex w-1/2 flex-col gap-2 text-center text-sm">
                <div className="flex flex-col gap-1">
                  <span>최대 크기: 3MB</span>
                  <span>허용 포맷: PNG, JPG, GIF</span>
                </div>
                <Input
                  className="hidden"
                  id="avatar"
                  name="avatar"
                  type="file"
                  ref={fileInputRef}
                  onChange={onChangeAvatar}
                  accept="image/*"
                />
                {avatarError ? (
                  <p className="text-destructive mt-1 text-xs">{avatarError}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="name" className="flex flex-col items-start gap-1">
                이름
              </Label>
              <Input
                id="name"
                name="name"
                required
                type="text"
                placeholder="이름을 입력해주세요."
                defaultValue={name}
                className="h-12 rounded-2xl placeholder:text-sm"
              />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.name ? (
                <FormErrors errors={fetcher.data?.fieldErrors?.name} />
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="marketingConsent"
                name="marketingConsent"
                defaultChecked={marketingConsent}
              />
              <Label
                htmlFor="marketingConsent"
                className="text-text-2 cursor-pointer"
              >
                마케팅 이메일 수신 동의
              </Label>
            </div>

            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            fetcher.data.fieldErrors?.marketingConsent ? (
              <FormErrors
                errors={fetcher.data?.fieldErrors?.marketingConsent}
              />
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <FetcherFormButton
            submitting={fetcher.state === "submitting"}
            label="프로필 저장"
            className="h-12 w-full cursor-pointer rounded-2xl text-base"
          />
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message="프로필 수정 완료" />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </CardFooter>
      </Card>

      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={pendingCropImage}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </fetcher.Form>
  );
}
