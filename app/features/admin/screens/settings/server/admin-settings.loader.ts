/**
 * 관리자 설정 페이지 로더
 * - requireAdmin 후 getSiteSettings(singleton_key='global') 조회
 */
import type { Route } from "../+types/admin-settings";

import { data } from "react-router";

import { requireAdmin } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getSiteSettings, type SiteSettingsRow } from "../queries";

export async function adminSettingsLoader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAdmin(client);

  const settings = await getSiteSettings(client);
  return data({ settings }, { headers });
}

export type { SiteSettingsRow };
