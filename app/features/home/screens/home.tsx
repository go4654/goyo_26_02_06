/**
 * Home Page Component

 */
import type { Route } from "./+types/home";

import { MoveRight } from "lucide-react";
import { Link } from "react-router";

import Container from "~/core/layouts/container";
import i18next from "~/core/lib/i18next.server";

import { CATEGORY_DATA } from "../constants/home-data";
import Section1 from "./sections/section_1";
import Section2 from "./sections/section_2";

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
    <>
      <Section1 />

      <Container>
        <Section2 />
      </Container>
    </>
  );
}
