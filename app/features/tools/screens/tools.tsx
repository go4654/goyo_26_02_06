import { redirect } from "react-router";

/** /tools 접속 시 랜덤 선택 페이지로 리다이렉트 */
export function loader() {
  throw redirect("/tools/random-choice");
}

/** 리다이렉트 시에는 렌더되지 않음 */
export default function ToolsIndex() {
  return null;
}
