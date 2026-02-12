import type { Route } from "./+types/blocked";

import { AlertCircle } from "lucide-react";
import { Link, redirect, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/core/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { checkUserBlocked } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `계정 차단 | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * 차단 페이지 로더
 *
 * 차단되지 않은 유저가 이 페이지에 접근하려고 하면 홈으로 리다이렉트합니다.
 * 차단된 유저만 이 페이지를 볼 수 있습니다.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // 차단 상태 확인
  const { isBlocked } = await checkUserBlocked(client);

  // 차단되지 않은 유저는 홈으로 리다이렉트
  if (!isBlocked) {
    throw redirect("/");
  }

  return {};
}

export default function BlockedPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            계정이 차단되었습니다
          </CardTitle>
          <CardDescription className="text-base">
            귀하의 계정은 서비스 이용이 제한되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>차단 사유</AlertTitle>
              <AlertDescription>{reason}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              계정 차단과 관련하여 문의사항이 있으시면 고객센터로 연락해
              주세요.
            </p>
            <p>
              차단 해제는 관리자 검토 후 진행되며, 해제 시 별도로 안내해
              드립니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" asChild className="w-full">
              <Link to="/">홈으로 돌아가기</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/logout">로그아웃</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
