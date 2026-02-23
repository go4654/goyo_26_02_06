import type { Route } from "./+types/admin-users-edit";

import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/core/components/ui/button";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";

import { formatDate } from "./lib/formatters";
import type { UserEditActionResponse } from "./server/users-edit.action";
import { userDetailLoader } from "./server/users-detail.loader";
import { userEditAction } from "./server/users-edit.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `유저 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = userDetailLoader;
export const action = userEditAction;

/**
 * 유저 수정 페이지
 *
 * - 읽기 전용: email, name, created_at, last_active_at, role
 * - 수정 가능: gallery_access, status(active|suspended), admin_note
 */
export default function AdminUsersEdit({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<UserEditActionResponse>();
  const { user: userData } = loaderData;

  const [formData, setFormData] = useState({
    galleryAccess: userData.galleryAccess,
    status: userData.status,
    adminMemo: userData.adminMemo,
  });

  /** 서버 저장 성공 시점의 폼 값 (저장 버튼 비활성화용) */
  const [savedAt, setSavedAt] = useState<
    { galleryAccess: boolean; status: "active" | "suspended"; adminMemo: string }
  >({
    galleryAccess: userData.galleryAccess,
    status: userData.status,
    adminMemo: userData.adminMemo,
  });

  const isDirty =
    formData.galleryAccess !== savedAt.galleryAccess ||
    formData.status !== savedAt.status ||
    formData.adminMemo !== savedAt.adminMemo;

  const submittedRef = useRef<typeof formData | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    submittedRef.current = { ...formData };

    const fd = new FormData();
    fd.append("galleryAccess", formData.galleryAccess ? "true" : "false");
    fd.append(
      "is_blocked",
      formData.status === "suspended" ? "true" : "false",
    );
    fd.append("adminNote", formData.adminMemo);

    fetcher.submit(fd, { method: "POST" });
  };

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.success === true) {
      if (submittedRef.current) {
        setSavedAt(submittedRef.current);
        submittedRef.current = null;
      }
      toast.success("저장 완료");
      return;
    }

    if (fetcher.data.success === false && fetcher.data.error) {
      submittedRef.current = null;
      toast.error("저장 실패", {
        description: fetcher.data.error,
      });
    }
  }, [fetcher.data]);

  const handleCancel = () => {
    navigate("/admin/users");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-h5">유저 수정</h1>
        <p className="text-text-2 mt-2 text-sm">
          유저 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 사용자 상세 - 기본 정보 (읽기 전용) */}
          <section className="space-y-4">
            <h2 className="text-h6 border-b border-white/10 pb-2">
              사용자 상세
            </h2>

            <div className="space-y-4">
              <h3 className="text-text-1 text-sm font-semibold">기본 정보</h3>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  value={userData.nickname}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdAt">가입일</Label>
                <Input
                  id="createdAt"
                  value={formatDate(userData.createdAt)}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastActiveAt">최근 활동일</Label>
                <Input
                  id="lastActiveAt"
                  value={
                    userData.lastActiveAt
                      ? formatDate(userData.lastActiveAt)
                      : "-"
                  }
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>
            </div>
          </section>

          {/* 권한 및 상태 설정 (수정 가능) */}
          <section className="space-y-4">
            <h2 className="text-h6 border-b border-white/10 pb-2">
              권한 및 상태 설정
            </h2>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="galleryAccess"
                  checked={formData.galleryAccess}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      galleryAccess: checked === true,
                    }))
                  }
                />
                <div className="cursor-pointer space-y-1">
                  <Label
                    htmlFor="galleryAccess"
                    className="cursor-pointer text-sm font-medium"
                  >
                    포폴 접근권한
                  </Label>
                  <p className="text-text-3 text-xs">
                    체크 시 갤러리(포트폴리오) 접근 권한이 부여됩니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">계정 상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "suspended") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-text-3 text-xs">
                  계정 상태를 변경할 수 있습니다. 정지된 계정은 로그인할 수
                  없습니다.
                </p>
              </div>
            </div>
          </section>

          {/* 관리자 메모 (수정 가능) */}
          <section className="space-y-4">
            <h2 className="text-h6 border-b border-white/10 pb-2">
              관리자 메모
            </h2>

            <div className="space-y-2">
              <Label htmlFor="adminMemo">메모</Label>
              <Textarea
                id="adminMemo"
                value={formData.adminMemo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    adminMemo: e.target.value,
                  }))
                }
                placeholder="유저에 대한 관리자 메모를 작성하세요..."
                rows={5}
                className="resize-none"
              />
              <p className="text-text-3 text-xs">
                이 메모는 관리자만 볼 수 있으며, 유저에게는 표시되지 않습니다.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
