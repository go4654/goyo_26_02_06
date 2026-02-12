# Admin Components

관리자 페이지에서 사용하는 공통 컴포넌트들입니다.

## AdminDataTable

갤러리, 뉴스, 댓글, 클래스 등 관리자 페이지에서 재사용 가능한 데이터 테이블 컴포넌트입니다.

### 주요 기능

- ✅ **컬럼 리사이징**: 컬럼 헤더 우측 경계선을 드래그하여 너비 조절
- ✅ **정렬**: 컬럼 헤더 클릭으로 오름차순/내림차순 정렬
- ✅ **검색**: 전역 필터로 모든 컬럼 데이터 검색
- ✅ **페이지네이션**: 이전/다음 페이지 이동
- ✅ **행 선택**: 체크박스로 단일/전체 행 선택
- ✅ **반응형**: 모바일/태블릿/데스크톱 대응

### 사용법

```tsx
import AdminDataTable from "~/features/admin/components/admin-data-table";
import { myColumns } from "./my-columns";

export default function MyAdminPage({ loaderData }) {
  return (
    <AdminDataTable
      data={loaderData.items}
      columns={myColumns}
      searchPlaceholder="검색..."
      emptyMessage="데이터가 없습니다."
      onRowSelectionChange={(selectedRows) => {
        console.log("선택된 항목:", selectedRows);
      }}
    />
  );
}
```

### Props

| Prop                  | Type                    | Required | Default             | Description                      |
| --------------------- | ----------------------- | -------- | ------------------- | -------------------------------- |
| `data`                | `TData[]`               | ✅       | -                   | 테이블에 표시할 데이터 배열      |
| `columns`             | `ColumnDef<TData>[]`    | ✅       | -                   | tanstack table 컬럼 정의         |
| `searchPlaceholder`   | `string`                | ❌       | `"검색..."`         | 검색 입력창 placeholder          |
| `emptyMessage`        | `string`                | ❌       | `"결과가 없습니다"` | 빈 데이터 시 표시할 메시지       |
| `onRowSelectionChange`| `(rows: TData[]) => void` | ❌     | -                   | 행 선택 시 호출되는 콜백 함수    |

### 컬럼 정의 예시

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/core/components/ui/checkbox";
import { formatDate, formatNumber } from "./lib/formatters";

export const myColumns: ColumnDef<MyDataType>[] = [
  // 체크박스 컬럼 (선택 기능)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableResizing: false, // 체크박스는 리사이징 비활성화
    size: 50,
    minSize: 50,
    maxSize: 50,
  },
  // 일반 컬럼
  {
    accessorKey: "title",
    header: "제목",
    cell: ({ row }) => <div>{row.original.title}</div>,
    size: 300, // 기본 너비
    minSize: 150, // 최소 너비
    maxSize: 500, // 최대 너비
  },
  // 숫자 포맷팅 컬럼
  {
    accessorKey: "views",
    header: "조회수",
    cell: ({ row }) => (
      <div className="tabular-nums">{formatNumber(row.original.views)}</div>
    ),
    size: 100,
    minSize: 80,
    maxSize: 150,
  },
  // 날짜 포맷팅 컬럼
  {
    accessorKey: "createdAt",
    header: "등록일",
    cell: ({ row }) => (
      <div className="tabular-nums">{formatDate(row.original.createdAt)}</div>
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
  },
  // 액션 컬럼
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DropdownMenu>
        {/* 수정, 삭제 등 액션 버튼 */}
      </DropdownMenu>
    ),
    enableResizing: false, // 액션 컬럼은 리사이징 비활성화
    size: 60,
  },
];
```

### 유틸리티 함수

숫자와 날짜 포맷팅을 위한 유틸리티 함수를 제공합니다.

#### formatNumber (숫자 포맷팅)

```tsx
import { formatNumber } from "./lib/formatters";

formatNumber(120);      // "120"
formatNumber(1200);     // "1.2천"
formatNumber(1000);     // "1천"
formatNumber(12430);    // "1.2만"
formatNumber(45000);    // "4.5만"
formatNumber(1234567);  // "123만"
```

#### formatDate (날짜 포맷팅)

luxon을 사용하여 날짜를 포맷팅합니다.

```tsx
import { formatDate } from "./lib/formatters";

formatDate("2026-02-10T10:12:00.000Z"); // "2026.02.10"
```

### 적용 사례

현재 다음 페이지에서 사용 중입니다:

- ✅ **클래스 관리** (`/admin/classes`)

향후 적용 예정:

- 🔄 갤러리 관리 (`/admin/gallery`)
- 🔄 뉴스 관리 (`/admin/news`)
- 🔄 댓글 관리
- 🔄 유저 관리 (`/admin/users`)

### 컬럼 리사이징 동작 방식

1. 컬럼 헤더 우측 경계선에 마우스를 올리면 커서가 `col-resize`로 변경됩니다.
2. 경계선을 클릭하고 드래그하면 컬럼 너비가 실시간으로 변경됩니다.
3. `minSize`와 `maxSize` 범위 내에서만 조절 가능합니다.
4. 체크박스와 액션 컬럼은 고정 너비로 리사이징이 비활성화되어 있습니다.

### 참고 사항

- tanstack table v8을 기반으로 구현되었습니다.
- 컬럼 정의에 `size`, `minSize`, `maxSize`를 설정하지 않으면 기본값이 적용됩니다.
- `enableResizing: false`를 설정하면 특정 컬럼의 리사이징을 비활성화할 수 있습니다.
