import { SearchIcon } from "lucide-react";
import { Form, useNavigate } from "react-router";
import { useState } from "react";
import { z } from "zod";

import { Input } from "~/core/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/core/components/ui/input-group";

/**
 * 검색 폼 검증 스키마
 *
 * 검색어는 선택적이지만, 입력된 경우:
 * - 최대 100자 이하
 * - 공백만으로 구성된 경우는 빈 문자열로 처리
 */
const searchSchema = z.object({
  search: z
    .string()
    .max(100, { message: "검색어는 100자 이하여야 합니다." })
    .optional()
    .transform((val) => (val?.trim() || "")),
  category: z.string().optional(),
});

export default function SearchForm({
  category,
  search,
}: {
  category: string | null;
  search: string | null;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      search: formData.get("search") as string,
      category: formData.get("category") as string,
    };

    // Zod 스키마로 검증
    const result = searchSchema.safeParse(formValues);

    if (!result.success) {
      // 검증 실패 시 첫 번째 에러 메시지 표시
      const firstError = result.error.errors[0];
      setError(firstError?.message || "검색어를 확인해주세요.");
      return;
    }

    const { search: searchValue } = result.data;

    // 검색어가 공백만으로 구성된 경우 제거
    const trimmedSearch = searchValue?.trim() || "";

    // URL 파라미터 생성
    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }
    // 검색 시 페이지는 1로 리셋 (page 파라미터 제거)

    // 네비게이션
    navigate(`/class?${params.toString()}`);
  };

  return (
    <div className="mt-4 w-full xl:mt-0 xl:w-[500px]">
      <Form method="get" onSubmit={handleSubmit}>
        {/* 카테고리 파라미터 유지 (검색 시 페이지는 1로 리셋) */}
        <Input type="hidden" name="category" value={category || ""} />

        <InputGroup className="h-[40px] rounded-full px-2 xl:h-[50px]">
          <InputGroupInput
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="찾고싶은 기록이 있으신가요?"
            className="placeholder:text-text-2/40 text-sm"
            maxLength={100}
          />
          <InputGroupAddon>
            <button
              type="submit"
              className="flex items-center justify-center cursor-pointer"
            >
              <SearchIcon className="size-5" />
            </button>
          </InputGroupAddon>
        </InputGroup>
      </Form>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
