import type { Route } from "../screens/+types/gallery";

import {
  requireAuthentication,
  requireNotBlocked,
} from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function galleryAction({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  // 보안: 차단된 유저는 갤러리 업로드 불가
  await requireNotBlocked(client);

  return {};
}
