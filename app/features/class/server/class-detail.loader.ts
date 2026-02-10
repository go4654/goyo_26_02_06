import type { Route } from "../screens/+types/class-detail";

import { bundleMDX } from "mdx-bundler";
import rehypePrettyCode from "rehype-pretty-code";

import makeServerClient from "~/core/lib/supa-client.server";

import {
  DESIGN_MOCKUP_SOURCE,
  DEV_MOCKUP_SOURCE,
} from "../constants/class-detail-mockup";

export async function classDetailLoader({ request }: Route.LoaderArgs) {
  //   const [client] = makeServerClient(request);

  //   const {
  //     data: { user },
  //   } = await client.auth.getUser();

  // 디자인 기록 목업
  const source = DESIGN_MOCKUP_SOURCE;
  //   const source = DEV_MOCKUP_SOURCE;

  const { code } = await bundleMDX({
    source,
    mdxOptions(options) {
      options.remarkPlugins = [...(options.remarkPlugins ?? [])];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        [rehypePrettyCode, { theme: "github-dark" }],
      ];
      return options;
    },
  });

  return { code };
}
