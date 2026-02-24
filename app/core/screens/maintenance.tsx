/**
 * 사이트 점검 화면
 * maintenanceMode일 때 관리자 제외 모든 사용자에게 표시
 * 점검 메시지는 공지 배너와 별도로 maintenanceMessage만 사용
 */
import { Construction } from "lucide-react";

interface MaintenanceScreenProps {
  message?: string | null;
}

export default function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Construction className="text-muted-foreground size-16" aria-hidden />
        <h1 className="text-h4 font-semibold">사이트 점검 중입니다</h1>
        {message && message.trim() && (
          <p className="text-muted-foreground max-w-md whitespace-pre-wrap text-sm">
            {message.trim()}
          </p>
        )}
      </div>
    </main>
  );
}
