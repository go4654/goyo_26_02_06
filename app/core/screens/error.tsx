import type { Route } from "./+types/error";

import { Link, useSearchParams } from "react-router";

import { Button } from "~/core/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Server Error | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export default function ErrorPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-3xl font-semibold text-red-700">
            Error
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Error code: {errorCode}
          </CardDescription>
          <CardContent className="text-muted-foreground">
            {errorDescription}
          </CardContent>
        </CardHeader>

        <Button variant={"link"} asChild>
          <Link to="/">홈으로 돌아가기</Link>
        </Button>
      </Card>
      {/* <h1 className="text-3xl font-semibold text-red-700">Error</h1> */}
      {/* <p className="text-muted-foreground">Error code: {errorCode}</p> */}
      {/* <p className="text-muted-foreground">{errorDescription}</p> */}
    </div>
  );
}
