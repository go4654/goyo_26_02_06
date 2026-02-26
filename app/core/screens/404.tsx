import { Link } from "react-router";

import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-background text-text-1 relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* subtle glow background */}
      <div className="bg-primary/20 absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full blur-3xl" />
      <div className="bg-primary/10 absolute right-[-150px] bottom-[-100px] h-[500px] w-[500px] rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          길을 잃으셨네요...
        </h1>

        <p className="text-text-2 max-w-md text-sm md:text-base">
          요청하신 페이지를 찾을 수 없습니다. 주소가 잘못되었거나, 더 이상
          존재하지 않는 페이지입니다.
        </p>

        <Button
          asChild
          className="mt-4 rounded-full px-8 py-5 text-sm md:text-base"
        >
          <Link to="/">홈으로 돌아가기 →</Link>
        </Button>
      </div>
    </div>
  );
}
