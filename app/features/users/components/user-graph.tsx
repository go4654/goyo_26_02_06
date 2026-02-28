import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import { CartesianGrid } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "~/core/components/ui/chart";

/** RPC get_profile_weekly_learning 반환값을 요일·날짜 포맷으로 변환한 차트용 타입 */
export interface WeeklyLearningChartItem {
  date: string;
  dateDisplay: string;
  weekday: string;
  views: number;
}

interface UserGraphProps {
  /** 최근 7일 학습 조회 수 (loader에서 RPC 결과 변환 후 전달) */
  data: WeeklyLearningChartItem[];
  /** RPC/로더 에러 시 표시 (optional, loader에서 throw 하면 페이지 레벨에서 처리) */
  error?: string | null;
}

const chartConfig = {
  views: {
    label: "조회 수",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function UserGraph({ data, error }: UserGraphProps) {
  const chartData = data ?? [];
  const hasData = chartData.length > 0;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 7일 학습 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            데이터를 불러올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 7일 학습 흐름</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="weekday"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as WeeklyLearningChartItem;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                      {p.dateDisplay} ({p.weekday}) - {p.views}회
                    </div>
                  );
                }}
              />
              <Bar dataKey="views" fill="#7c4dff" radius={8} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground text-sm">
              최근 7일 학습 데이터가 없습니다.
            </p>
          </div>
        )}
      </CardContent>
      {/* {hasData && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="text-text-2 flex gap-2 text-[12px] leading-none font-medium xl:text-sm">
            최근 학습 흐름
            <TrendingUp className="text-success h-4 w-4" />
          </div>
        </CardFooter>
      )} */}
    </Card>
  );
}
