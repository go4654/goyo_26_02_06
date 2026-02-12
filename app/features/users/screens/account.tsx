import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await, redirect } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
import ConnectSocialAccountsForm from "../components/forms/connect-social-accounts-form";
import DeleteAccountForm from "../components/forms/delete-account-form";
import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `프로필 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  // 보안: 인증되지 않은 사용자는 접근 불가
  if (!user) {
    throw redirect("/login");
  }

  const identities = client.auth.getUserIdentities();
  
  // getUserProfile 함수가 내부적으로 userId 검증을 수행하므로
  // 다른 사용자의 프로필 조회 시도는 자동으로 차단됨
  const profile = getUserProfile(client, { userId: user.id });
  
  return {
    user,
    identities,
    profile,
  };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, identities, profile } = loaderData;
  const hasEmailIdentity = user?.identities?.some(
    (identity) => identity.provider === "email",
  );
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-24 pb-8 xl:py-40">
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={profile}
          errorElement={
            <div className="text-red-500">
              프로필을 불러오는데 실패했습니다.
            </div>
          }
        >
          {(profile) => {
            if (!profile) {
              return null;
            }
            return (
              <EditProfileForm
                name={profile.name}
                marketingConsent={profile.marketing_consent}
                avatarUrl={profile.avatar_url}
              />
            );
          }}
        </Await>
      </Suspense>
      <ChangeEmailForm email={user?.email ?? ""} />
      <ChangePasswordForm hasPassword={hasEmailIdentity ?? false} />
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={identities}
          errorElement={
            <div className="text-red-500">
              소셜 계정을 불러오는데 실패했습니다.
            </div>
          }
        >
          {({ data, error }) => {
            if (!data) {
              return (
                <div className="text-red-500">
                  <span>소셜 계정을 불러오는데 실패했습니다.</span>
                  <span className="text-xs">Code: {error.code}</span>
                  <span className="text-xs">Message: {error.message}</span>
                </div>
              );
            }
            return (
              <ConnectSocialAccountsForm
                providers={data.identities
                  .filter((identity) => identity.provider !== "email")
                  .map((identity) => identity.provider)}
              />
            );
          }}
        </Await>
      </Suspense>
      <DeleteAccountForm />
    </div>
  );
}
