import type { Route } from "../screens/+types/gallery-detail";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function galleryDetailLoader({
  request,
  params,
}: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  return {
    slug: params.slug,
    headers,
  };
}
