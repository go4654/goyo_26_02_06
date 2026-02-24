import type { Route } from "./+types/admin-settings";

import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";

import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Label } from "~/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Switch } from "~/core/components/ui/switch";
import { Textarea } from "~/core/components/ui/textarea";

import {
  type AdminSettingsActionData,
  adminSettingsAction,
} from "./server/admin-settings.action";
import { adminSettingsLoader } from "./server/admin-settings.loader";

export const meta: Route.MetaFunction = () => {
  return [{ title: `설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = adminSettingsLoader;
export const action = adminSettingsAction;

const NOTICE_VARIANTS = [
  { value: "info", label: "정보" },
  { value: "warning", label: "경고" },
  { value: "event", label: "이벤트" },
] as const;

export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  const { settings } = loaderData;
  const fetcher = useFetcher<AdminSettingsActionData>();
  const revalidator = useRevalidator();
  const lastSuccessRef = useRef<AdminSettingsActionData | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(
    settings.maintenance_mode,
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    settings.maintenance_message ?? "",
  );
  const [signupEnabled, setSignupEnabled] = useState(settings.signup_enabled);
  const [noticeEnabled, setNoticeEnabled] = useState(settings.notice_enabled);
  const [noticeMessage, setNoticeMessage] = useState(
    settings.notice_message ?? "",
  );
  const [noticeVariant, setNoticeVariant] = useState<
    "info" | "warning" | "event"
  >(settings.notice_variant);

  // 로더 데이터 변경 시 로컬 상태 동기화
  useEffect(() => {
    setMaintenanceMode(settings.maintenance_mode);
    setMaintenanceMessage(settings.maintenance_message ?? "");
    setSignupEnabled(settings.signup_enabled);
    setNoticeEnabled(settings.notice_enabled);
    setNoticeMessage(settings.notice_message ?? "");
    setNoticeVariant(settings.notice_variant);
  }, [settings]);

  // 저장 성공 시 toast 1회 + revalidate 1회
  useEffect(() => {
    const d = fetcher.data;
    if (fetcher.state !== "idle" || !d || !("success" in d) || !d.success)
      return;
    if (lastSuccessRef.current === d) return;
    lastSuccessRef.current = d;
    toast.success("설정이 저장되었습니다.");
    revalidator.revalidate();
  }, [fetcher.state, fetcher.data, revalidator]);

  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4 pt-0">
      <h1 className="text-h5">사이트 설정</h1>

      <fetcher.Form method="post" className="flex max-w-xl flex-col gap-6">
        <input
          type="hidden"
          name="maintenanceMode"
          value={maintenanceMode ? "true" : "false"}
        />
        <input
          type="hidden"
          name="signupEnabled"
          value={signupEnabled ? "true" : "false"}
        />
        <input
          type="hidden"
          name="noticeEnabled"
          value={noticeEnabled ? "true" : "false"}
        />
        <input type="hidden" name="noticeVariant" value={noticeVariant} />

        {/* 점검 모드 · 회원가입 · 공지 표시 */}
        <Card>
          <CardHeader>
            <CardTitle>점검 모드 · 회원가입 · 공지 표시</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="maintenance-mode">점검 모드</Label>
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="maintenance-message">점검 메시지</Label>
              <Textarea
                id="maintenance-message"
                name="maintenanceMessage"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="점검 화면에 표시할 메시지를 입력하세요. (공지 배너와 별도)"
                disabled={isSubmitting}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="signup-enabled">회원가입 허용</Label>
              <Switch
                id="signup-enabled"
                checked={signupEnabled}
                onCheckedChange={setSignupEnabled}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notice-enabled">공지 배너 표시</Label>
              <Switch
                id="notice-enabled"
                checked={noticeEnabled}
                onCheckedChange={setNoticeEnabled}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* 공지 배너 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>공지 배너</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="notice-message">공지 메시지</Label>
              <Textarea
                id="notice-message"
                name="noticeMessage"
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                placeholder="배너에 표시할 메시지를 입력하세요."
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notice-variant">공지 유형</Label>
              <Select
                value={noticeVariant}
                onValueChange={(v) =>
                  setNoticeVariant(v as "info" | "warning" | "event")
                }
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="notice-variant"
                  className="w-full max-w-[200px]"
                >
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_VARIANTS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {fetcher.data && "error" in fetcher.data && (
          <p className="text-destructive text-sm">{fetcher.data.error}</p>
        )}

        <div>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            저장
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
