import { type ReactNode } from "react";
import { TopNavbar } from "./top-navbar";
import { LeftSidebar } from "./left-sidebar";
import { MobileBottomDock } from "./mobile-bottom-dock";
import { LocationModalHost } from "@/components/app-shell";
import { ReplaceCartDialog } from "@/components/cart/replace-cart-dialog";

interface SocialCommerceShellProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  hideFloatingCreatorDock?: boolean;
  hideMobileBottomDock?: boolean;
  hideBottomDock?: boolean;
}

export function SocialCommerceShell({
  children,
  rightSidebar,
  hideFloatingCreatorDock = false,
  hideMobileBottomDock = false,
  hideBottomDock = false,
}: SocialCommerceShellProps) {
  const isDockHidden = hideBottomDock || hideMobileBottomDock || hideFloatingCreatorDock;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-[#0F172A] ${isDockHidden ? "pb-6 lg:pb-16" : "pb-24 lg:pb-24"}`}>
      {/* Sticky Top Navbar */}
      <TopNavbar />

      {/* Main 3-Column / 2-Column Responsive Layout */}
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
        <div className="flex gap-6 items-start">
          {/* Left Persistent Navigation Sidebar */}
          <LeftSidebar />

          {/* Center Main Content Area */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            {children}
          </main>

          {/* Optional Right Sidebar (Contextual) */}
          {rightSidebar && (
            <aside className="w-80 xl:w-84 shrink-0 space-y-4 hidden xl:block">
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>

      {/* Unified Bottom Navigation Dock for Both Mobile and Desktop */}
      {!isDockHidden && <MobileBottomDock />}

      {/* Global Modals & Dialogs */}
      <LocationModalHost />
      <ReplaceCartDialog />
    </div>
  );
}
