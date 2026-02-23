import type { Route } from "./+types/admin-users-edit";

import { useState } from "react";
import { useNavigate } from "react-router";

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
import { userDetailLoader } from "./server/users-detail.loader";
import { usersAction } from "./server/users.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `유저 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = userDetailLoader;
export const action = usersAction;

/**
 * 유저 수정 페이지
 *
 * 기능:
 * - 사용자 기본 정보 표시 (읽기 전용)
 * - 포폴 접근 권한 설정 (gallery_access)
 * - 계정 상태 변경 (active, suspended)
 * - 관리자 메모 작성
 */
export default function AdminUsersEdit({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { user: userData } = loaderData;

  /**
   * 폼 상태 관리
   */
  const [formData, setFormData] = useState({
    galleryAccess: userData.galleryAccess,
    status: userData.status,
    adminMemo: userData.adminMemo,
  });

  /**
   * 폼 제출 핸들러
   * 유저 정보 수정 데이터를 처리합니다.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Supabase 연동하여 실제 수정 처리

    // TODO: Supabase 업데이트
    // await supabase
    //   .from('users')
    //   .update({
    //     gallery_access: formData.galleryAccess,
    //     status: formData.status,
    //     admin_memo: formData.adminMemo,
    //   })
    //   .eq('id', userData.id);

    alert("유저 정보가 수정되었습니다. (임시 메시지)");
    navigate("/admin/users");
  };

  /**
   * 취소 핸들러
   * 목록 페이지로 이동합니다.
   */
  const handleCancel = () => {
    navigate("/admin/users");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-6 p-4 pt-0">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-h5">유저 수정</h1>
        <p className="text-text-2 mt-2 text-sm">
          유저 정보를 확인하고 수정할 수 있습니다.
        </p>
      </div>

      {/* 폼 영역 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 사용자 상세 - 기본 정보 섹션 */}
          <section className="space-y-4">
            <h2 className="text-h6 border-b border-white/10 pb-2">
              사용자 상세
            </h2>

            <div className="space-y-4">
              <h3 className="text-text-1 text-sm font-semibold">기본 정보</h3>

              {/* 이메일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={userData.email}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              {/* 닉네임 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  value={userData.nickname}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              {/* 가입일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="createdAt">가입일</Label>
                <Input
                  id="createdAt"
                  value={formatDate(userData.createdAt)}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>

              {/* 최근 활동일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="lastActiveAt">최근 활동일</Label>
                <Input
                  id="lastActiveAt"
                  value={userData.lastActiveAt ? formatDate(userData.lastActiveAt) : "-"}
                  disabled
                  className="text-text-3 bg-white/5"
                />
              </div>
            </div>
          </section>

          {/* 권한 및 상태 설정 섹션 */}
          <section className="space-y-4">
            <h2 className="text-h6 border-b border-white/10 pb-2">
              권한 및 상태 설정
            </h2>

            <div className="space-y-6">
              {/* 포폴 접근 권한 */}
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
                    포폴 접근 권한
                  </Label>
                  <p className="text-text-3 text-xs">
                    체크 시 갤러리(포트폴리오) 접근 권한이 부여됩니다.
                    (gallery_access)
                  </p>
                </div>
              </div>

              {/* 계정 상태 변경 */}
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

          {/* 관리자 메모 섹션 */}
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

          {/* 액션 버튼 */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit">수정 완료</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
