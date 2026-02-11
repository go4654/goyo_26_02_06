import type { Route } from "../screens/+types/gallery";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function galleryLoader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  return {};
}
