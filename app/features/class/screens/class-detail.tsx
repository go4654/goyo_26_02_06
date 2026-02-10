import type { Route } from "./+types/class-detail";

import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import {
  ArrowUpDown,
  Bookmark,
  EllipsisVertical,
  Heart,
  MoveLeft,
  MoveRight,
  Pencil,
  Trash,
} from "lucide-react";
import { Form, Link, useNavigate } from "react-router";

import Tags from "~/core/components/tags";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Input } from "~/core/components/ui/input";
import { Separator } from "~/core/components/ui/separator";

import ClassComment from "../comments/class-comment";
import { classDetailLoader } from "../server/class-detail.loader";
import MDXRenderer from "./class-markdown-rander";

export const meta: Route.MetaFunction = () => {
  return [{ title: "CLASS | 고요" }];
};

export const loader = classDetailLoader;

export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[800px] py-24 xl:py-40">
      {/* 타이틀 영역 */}
      <div>
        <div className="text-small-title text-text-3 flex items-center gap-2">
          <span>2026.02.10</span>
          <span className="text-text-3/50">•</span>
          <div className="flex cursor-pointer items-center gap-2">
            <Heart />
            <span>121</span>
          </div>
          <span className="text-text-3/50">•</span>
          <div className="flex cursor-pointer items-center gap-2">
            <Bookmark />
            <span>54</span>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-h4 xl:text-h2">
            비전공자도 칭찬받는 폰트 위계 잡기
          </h1>

          <p className="text-h6 text-text-2/80 mt-2">
            왜 내가 만든 디자인은 가독성이 떨어질까? 그 해답은 폰트의 크기가
            아니라 '위계'에 있습니다.
          </p>

          <div className="mt-6">
            <Tags tags={["퍼블리싱", "HTML"]} borderColor="primary" />
          </div>
        </div>
      </div>

      {/* 썸네일 영역 (기존 디자인 유지) */}
      <div className="mt-12">
        <div className="aspect-[16/7] rounded-2xl bg-white/10" />
      </div>

      {/* ✅ 여기부터가 새로 추가된 "본문 MDX 영역" */}
      <div>
        <MDXRenderer code={loaderData.code} />
      </div>

      <Separator className="mt-26 mb-6" />

      <div className="flex w-full flex-col items-center justify-between">
        {/* 목록으로가기, 좋아요, 북마크 버튼 */}
        <div className="flex w-full items-center justify-between">
          {/* 목록으로가기 */}
          <div
            className="text-small-title text-text-2 hover:text-primary flex cursor-pointer items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <MoveLeft className="size-4" />
            <span>목록으로 가기</span>
          </div>

          {/* 좋아요, 북마크 버튼 */}
          <div className="text-small-title text-text-3 flex items-center gap-2">
            <div className="flex cursor-pointer items-center gap-2">
              <Heart />
              <span>121</span>
            </div>
            <span className="text-text-3/50">•</span>
            <div className="flex cursor-pointer items-center gap-2">
              <Bookmark />
              <span>54</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex w-[220px] items-center justify-between">
          <Link to="/class/1" className="group flex items-center gap-2">
            <div className="border-text-2 flex items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
              <MoveLeft
                className="text-text-2 ml-1 size-5 transition-all duration-300 group-hover:text-white"
                strokeWidth={1}
              />
            </div>
            <span className="text-small-title text-text-2 transition-all duration-300 group-hover:text-white">
              PREV
            </span>
          </Link>

          <Link to="/class/2" className="group flex items-center gap-2">
            <span className="text-small-title text-text-2 transition-all duration-300 group-hover:text-white">
              NEXT
            </span>
            <div className="border-text-2 flex items-center justify-start rounded-full border group-hover:border-white xl:h-[35px] xl:w-[35px]">
              <MoveRight
                className="text-text-2 ml-1 size-5 transition-all duration-300 group-hover:text-white"
                strokeWidth={1}
              />
            </div>
          </Link>
        </div>
      </div>

      <ClassComment />
    </div>
  );
}
