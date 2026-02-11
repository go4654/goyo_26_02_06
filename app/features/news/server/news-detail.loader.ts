import type { Route } from "../screens/+types/news-detail";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function newsDetailLoader({ request, params }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  return { slug: params.slug };
}
