import { Home, Server, Send, FileText, Settings, Languages } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();

  const menuItems = [
    {
      title: t('Dashboard'),
      url: "/",
      icon: Home,
    },
    {
      title: t('servers'),
      url: "/servers",
      icon: Server,
    },
    {
      title: t('send_message'),
      url: "/send-message",
      icon: Send,
    },
    {
      title: t('Bewerbungen', 'Bewerbungen'),
      url: "/applications",
      icon: FileText,
    },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary-foreground">EA</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-semibold text-sidebar-foreground truncate">
              Minecraft Bot
            </h2>
            <p className="text-xs text-muted-foreground truncate">Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={location === item.url ? "bg-sidebar-accent" : ""}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
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
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2" 
          onClick={toggleLanguage}
          data-testid="button-toggle-language"
        >
          <Languages className="w-4 h-4" />
          <span>{i18n.language === 'de' ? 'English' : 'Deutsch'}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
