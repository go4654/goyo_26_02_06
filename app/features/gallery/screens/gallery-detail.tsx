import type { Route } from "./+types/gallery-detail";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAuthentication } from "~/core/lib/guards.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: "갤러리 상세 페이지" }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  return {
    slug: params.slug,
    headers,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const [client, headers] = makeServerClient(request);
  await requireAuthentication(client);

  return {
    headers,
  };
}

export default function GalleryDetail({ loaderData }: Route.ComponentProps) {
  return <div>갤러리 상세 페이지</div>;
}
