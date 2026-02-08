/**
 * Home Page Component

 */
import type { Route } from "./+types/home";

import { useTranslation } from "react-i18next";

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
  // Get the translation function for the current locale
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      {/* Main headline with responsive typography */}
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
        {t("home.title")}
      </h1>

      {/* Subtitle */}
      <h2 className="text-2xl">{t("home.subtitle")}</h2>
    </div>
  );
}
