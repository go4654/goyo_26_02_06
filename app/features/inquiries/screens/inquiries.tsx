import type { Route } from "./+types/inquiries";

import { Form } from "react-router";

import FormButton from "~/core/components/form-button";
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

export const meta: Route.MetaFunction = () => {
  return [{ title: `문의하기 | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function Inquiries() {
  return (
    <div className="mx-auto mt-20 w-full px-4 xl:mt-25 xl:max-w-[800px]">
      <h1 className="mb-12 text-2xl font-semibold">문의하기</h1>

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
            placeholder="문의하실 제목을 입력해주세요."
            className="h-[45px]"
          />
        </div>

        <div>
          <Label htmlFor="message" className="mb-2">
            문의 종류
          </Label>
          <Select name="type" required>
            <SelectTrigger className="!h-[45px]">
              <SelectValue placeholder="문의 종류를 선택해주세요" />
              <SelectContent>
                <SelectItem value="general">일반 문의</SelectItem>
                <SelectItem value="class">클래스 관련</SelectItem>
                <SelectItem value="gallery">갤러리 관련</SelectItem>
                <SelectItem value="account">계정/기술 문제</SelectItem>
                <SelectItem value="etc">기타</SelectItem>
              </SelectContent>
            </SelectTrigger>
          </Select>
        </div>

        <div>
          <Label htmlFor="content" className="mb-2">
            문의 내용
          </Label>
          <Textarea
            id="content"
            name="content"
            required
            // rows={10}
            className="min-h-[150px]"
            placeholder="문의 내용을 입력해주세요. (최소 10자 이상)"
          />
        </div>

        <div>
          <Label htmlFor="name" className="mb-2">
            첨부 파일
          </Label>
          <Input id="attachment" name="attachment" required type="file" />
        </div>

        <FormButton label="문의하기" className="h-[45px] cursor-pointer" />
      </Form>
    </div>
  );
}
