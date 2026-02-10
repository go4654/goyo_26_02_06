import type { ReactNode } from "react";

/**
 * ThreeColumns
 *
 * MDX에서 사용하는 3분할 카드 레이아웃 블록
 *
 * 사용 예:
 *
 * <ThreeColumns>
 *   <ThreeColumns.Item title="크기(Size)">설명</ThreeColumns.Item>
 *   <ThreeColumns.Item title="굵기(Weight)">설명</ThreeColumns.Item>
 *   <ThreeColumns.Item title="밀도(Density)">설명</ThreeColumns.Item>
 * </ThreeColumns>
 */

export function ThreeColumns({ children }: { children: ReactNode }) {
  return <div className="mt-10 grid gap-6 md:grid-cols-3">{children}</div>;
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="[&_p]:text-text-2 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm [&_p]:text-sm [&_p]:leading-relaxed">
      <h4 className="text-text-1 xl:text-small-title mb-3 text-base font-semibold">
        {title}
      </h4>
      <p className="text-text-2 text-body leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * ThreeColumns.Item 형태로 사용하기 위해 하위 컴포넌트 연결
 */
ThreeColumns.Item = Item;
