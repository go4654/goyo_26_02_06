/**
 * 메시지 배열을 id 기준으로 병합합니다.
 *
 * 목적:
 * - optimistic append(즉시 append) 이후 revalidate가 느리거나 구버전 데이터를 돌려줘도
 *   화면에서 방금 보낸 메시지가 "사라지지" 않도록 보호
 * - loaderData.messages와 localMessages를 안전하게 동기화
 */
export function mergeMessagesById<T extends { id: string; createdAt: string }>(
  base: T[],
  incoming: T[],
): T[] {
  const map = new Map<string, T>();

  // base 먼저
  for (const m of base) map.set(m.id, m);
  // incoming으로 덮어쓰기 (서버가 가진 최신 형태 우선)
  for (const m of incoming) map.set(m.id, m);

  return Array.from(map.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

