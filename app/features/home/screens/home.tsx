/**
 * Home Page Component

 */
import type { Route } from "./+types/home";

import { AuroraText } from "~/core/components/ui/aurora-text";
import { Button } from "~/core/components/ui/button";
import { Particles } from "~/core/components/ui/particles";
import { TextAnimate } from "~/core/components/ui/text-animate";
import Container from "~/core/layouts/container";
import i18next from "~/core/lib/i18next.server";

/**
 * Meta function for setting page metadata

 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching

 * @param request - The incoming HTTP request containing locale information
 * @returns Object with translated title and subtitle strings
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get a translation function for the user's locale from the request
  const t = await i18next.getFixedT(request);

  // Return translated strings for use in both the component and meta function
  return {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
  };
}

/**
 * Home page component

 * @returns JSX element representing the home page
 */
export default function Home() {
  return (
    <section className="relative h-screen w-full">
      <div className="absolute top-0 left-0 h-screen w-full overflow-hidden">
        <Particles quantity={500} />
      </div>
      <Container>
        <div className="relative flex h-screen flex-col items-start justify-center">
          <h1 className="font-roboto text-[200px] leading-[180px] font-bold tracking-[-0.02em]">
            Silent Growth <br />
            <AuroraText colors={["#7C4DFF", "#BB86FC", "#03DAC6"]} speed={2}>
              Partner.
            </AuroraText>
          </h1>
          <p className="text-h6 text-text-2 mt-4 mb-14">
            조용히 쌓인 기록이, 가장 단단한 성장을 만듭니다.
          </p>
          <Button
            variant="outline"
            className="border-secondary dark:border-secondary text-text-2 dark:hover:bg-primary border-1 px-8 py-6"
          >
            기록 보러가기 &rarr;
          </Button>
        </div>
      </Container>
    </section>
  );
}
