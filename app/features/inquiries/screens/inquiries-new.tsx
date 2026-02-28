import type { InquiryCategory } from "../lib/mock-inquiries";
import type { Route } from "./+types/inquiries-new";

import { Form } from "react-router";

import FormButton from "~/core/components/form-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";

import { INQUIRY_CATEGORY_LABELS } from "../lib/mock-inquiries";
import { inquiriesCreateAction } from "../server/inquiries.action";

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의하기 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = inquiriesCreateAction;

/** 문의 작성 폼 (제목, 카테고리, 내용만 전송. status/profile_id는 서버에서 설정) */
export default function InquiriesNew() {
  return (
    <div className="mx-auto w-full px-4 py-6 xl:max-w-[800px] xl:py-12">
      <Card>
        <CardHeader>
          <CardTitle>문의하기</CardTitle>
          <CardDescription>
            문의 내용을 입력해 주세요. 담당자가 확인 후 답변드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex flex-col gap-7">
            <div>
              <Label htmlFor="title" className="mb-3">
                제목
              </Label>
              <Input
                id="title"
                name="title"
                required
                type="text"
                placeholder="문의하실 제목을 입력해 주세요."
                className="h-[45px]"
              />
            </div>

            <div>
              <Label htmlFor="category" className="mb-2">
                문의 종류
              </Label>
              <select
                id="category"
                name="category"
                required
                defaultValue="general"
                className="border-input bg-background focus-visible:ring-ring flex h-[45px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              >
                {(
                  Object.entries(INQUIRY_CATEGORY_LABELS) as [
                    InquiryCategory,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="content" className="mb-2">
                문의 내용
              </Label>
              <Textarea
                id="content"
                name="content"
                required
                className="min-h-[150px]"
                placeholder="문의 내용을 입력해 주세요. (최소 10자 이상)"
              />
            </div>

            <FormButton label="문의하기" className="h-[45px] cursor-pointer" />
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
