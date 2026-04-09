import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileSignature,
  CreditCard,
  ShieldCheck,
  ClipboardList,
  Bell,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { setTheme } = useTheme();
  
  const { data: summary } = useGetDashboardSummary({
    query: {
      queryKey: ["dashboard-summary"]
    }
  });

  const unreadCount = summary?.unreadNotifications || 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r-0 bg-sidebar/95 backdrop-blur-xl">
          <SidebarHeader className="py-6 px-4">
            <Link href="/dashboard" className="flex items-center gap-2 group outline-none" data-testid="link-home">
              <div className="size-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-sm group-hover:bg-primary/90 transition-colors">
                G
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-sidebar-foreground uppercase text-sm">GlobalHR</span>
                <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest font-mono">Platform</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-widest text-sidebar-foreground/50 font-mono mb-2">Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/dashboard"} tooltip="Dashboard">
                      <Link href="/dashboard" data-testid="nav-dashboard">
                        <LayoutDashboard className="size-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/workers")} tooltip="Workers">
                      <Link href="/workers" data-testid="nav-workers">
                        <Users className="size-4" />
                        <span>Workers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/contracts")} tooltip="Contracts">
                      <Link href="/contracts" data-testid="nav-contracts">
                        <FileSignature className="size-4" />
                        <span>Contracts</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/payments")} tooltip="Payments">
                      <Link href="/payments" data-testid="nav-payments">
                        <CreditCard className="size-4" />
                        <span>Payments</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs uppercase tracking-widest text-sidebar-foreground/50 font-mono mb-2">Risk & Task</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/compliance")} tooltip="Compliance">
                      <Link href="/compliance" data-testid="nav-compliance">
                        <ShieldCheck className="size-4" />
                        <span>Compliance</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/onboarding")} tooltip="Onboarding">
                      <Link href="/onboarding" data-testid="nav-onboarding">
                        <ClipboardList className="size-4" />
                        <span>Onboarding</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/notifications")} tooltip="Notifications">
                  <Link href="/notifications" className="flex justify-between items-center w-full" data-testid="nav-notifications">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4" />
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 min-w-5 flex items-center justify-center rounded-sm text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-muted/30">
          <header className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-foreground/70 hover:text-foreground" />
              <div className="h-4 w-[1px] bg-border" />
              <h1 className="text-sm font-semibold tracking-wide uppercase" data-testid="header-title">
                {location === "/dashboard" ? "Command Center" :
                 location.startsWith("/workers/new") ? "New Worker" :
                 location.startsWith("/workers") ? "Worker Directory" :
                 location.startsWith("/contracts/new") ? "New Contract" :
                 location.startsWith("/contracts") ? "Contracts" :
                 location.startsWith("/payments") ? "Payroll Runs" :
                 location.startsWith("/compliance") ? "Compliance Tracker" :
                 location.startsWith("/onboarding") ? "Onboarding Flow" :
                 location.startsWith("/notifications") ? "Notifications" : "GlobalHR"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-none text-foreground/70" data-testid="btn-theme-toggle">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-none cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-none cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-none cursor-pointer">
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="size-8 rounded-none bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase tracking-wider">
                HR
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10 w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
