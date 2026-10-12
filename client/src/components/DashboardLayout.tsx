import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { BriefcaseBusiness, Home, LayoutDashboard, LogOut, PanelLeft, Settings as SettingsIcon, Truck, UserRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { BrandLogo } from './BrandLogo';
import { Button } from "./ui/button";

const menuItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  allowPublic = false,
}: {
  children: React.ReactNode;
  allowPublic?: boolean;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [adminSessionToken] = useState(() => localStorage.getItem("adminSessionToken"));
  const adminLogout = trpc.adminAuth.logout.useMutation();
  const adminSession = trpc.adminAuth.verifySession.useQuery(
    { sessionToken: adminSessionToken ?? "" },
    { enabled: Boolean(adminSessionToken), retry: false },
  );
  const adminUser = adminSession.data?.valid
    ? { name: "Owner Admin", email: adminSession.data.username ?? "", role: "admin" as const }
    : null;
  const effectiveUser = user ?? adminUser;
  const isAdminSessionLoading = Boolean(adminSessionToken) && adminSession.isLoading;

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading || isAdminSessionLoading) {
    return <DashboardLayoutSkeleton />
  }

  if (!effectiveUser && !allowPublic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              setLocation("/auth");
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (!effectiveUser && allowPublic) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
        userOverride={effectiveUser}
        allowPublic={allowPublic}
        onLogoutOverride={adminUser ? () => {
          const token = localStorage.getItem("adminSessionToken");
          if (token) adminLogout.mutate({ sessionToken: token });
          localStorage.removeItem("adminSessionToken");
          setLocation("/auth");
        } : undefined}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  userOverride?: { name?: string | null; email?: string | null; role?: string | null } | null;
  allowPublic?: boolean;
  onLogoutOverride?: () => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  userOverride,
  allowPublic: _allowPublic,
  onLogoutOverride,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const effectiveUser = user ?? userOverride;
  const isAdmin = effectiveUser?.role === "admin";
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const workspaceLabel = location.startsWith("/customer")
    ? "Customer workspace"
    : location.startsWith("/courier")
      ? "Courier workspace"
      : location.startsWith("/fleet")
        ? "Fleet workspace"
        : location.startsWith("/admin")
          ? "Admin workspace"
          : activeMenuItem?.label ?? "Dashboard";
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white"><BrandLogo className="h-10 w-10 rounded-md" /></span>
                    <span className="font-semibold tracking-tight truncate">
                      {workspaceLabel}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {effectiveUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {effectiveUser?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {effectiveUser?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAdmin ? (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/admin/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />Admin workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/customer/dashboard")} className="cursor-pointer">
                      <UserRound className="mr-2 h-4 w-4" />Customer workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/courier/dashboard")} className="cursor-pointer">
                      <Truck className="mr-2 h-4 w-4" />Courier workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/fleet/dashboard")} className="cursor-pointer">
                      <BriefcaseBusiness className="mr-2 h-4 w-4" />Fleet workspace
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem
                  onClick={onLogoutOverride ?? logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {workspaceLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
