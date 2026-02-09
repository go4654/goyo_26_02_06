/**
 * Footer Component
 *
 * A responsive footer that displays copyright information and legal links.
 * This component appears at the bottom of every page in the application and
 * provides essential legal information and copyright notice.
 *
 * Features:
 * - Responsive design that adapts to different screen sizes
 * - Dynamic copyright year that automatically updates
 * - Links to legal pages (Privacy Policy, Terms of Service)
 * - View transitions for smooth navigation to legal pages
 */
import { Link } from "react-router";

import { LOGO_URL } from "../constant/imgUrls";

/**
 * Footer component for displaying copyright information and legal links
 *
 * This component renders a responsive footer that adapts to different screen sizes.
 * On mobile, it displays the legal links above the copyright notice, while on desktop,
 * it displays them side by side with the copyright on the left and links on the right.
 *
 * @returns A footer component with copyright information and legal links
 */
export default function Footer() {
  return (
    <footer className="mt-auto pt-14 pb-5 dark:bg-[#0F1117]">
      <div className="mx-auto flex h-full w-full flex-col items-center justify-center md:max-w-[1680px]">
        <div className="grid w-full grid-cols-3 items-center">
          {/* 로고 */}
          <Link to="/" className="flex justify-start">
            <img src={LOGO_URL} alt="logo" className="w-[110px]" />
          </Link>

          {/* 네비게이션 */}
          <ul className="flex items-center justify-center gap-10">
            <li>
              <Link to="/" className="hover:text-text-2">
                HOME
              </Link>
            </li>
            <li>
              <Link to="/class" className="hover:text-text-2">
                CLASS
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-text-2">
                GALLERY
              </Link>
            </li>
            <li>
              <Link to="/news">NEWS</Link>
            </li>
          </ul>

          {/* 이용약관 */}
          <div className="text-text-2 flex justify-end gap-5 md:text-sm">
            <Link to="/legal/privacy-policy" viewTransition>
              개인정보처리방침
            </Link>
            <Link to="/legal/terms-of-service" viewTransition>
              이용약관
            </Link>
          </div>
        </div>

        {/* 카피라이트 */}
        <div className="text-text-2 order-2 mt-20 text-sm md:order-none">
          <p>
            &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
