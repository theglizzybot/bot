import { Home, Server, Send, FileText, Languages } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next"; // Wichtig!
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location] = useLocation();
  const { i18n } = useTranslation(); // Wir brauchen das Objekt, auch wenn wir t() nicht nutzen

  const menuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Servers", url: "/servers", icon: Server },
    { title: "Send Message", url: "/send-message", icon: Send },
    { title: "Applications", url: "/applications", icon: FileText },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">
              EA
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold">Minecraft Bot</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
              Management
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-green-500">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          System Online
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
