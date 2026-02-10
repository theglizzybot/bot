import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, FileText, Clock } from "lucide-react";
import type { BotStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: botStatus, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {t('bot_info_description', 'Übersicht über den Emergency Assistant Bot-Status')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-bot-status">
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('status')}</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {botStatus?.online ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-status-online animate-pulse"></div>
                        <span className="text-2xl font-bold text-foreground">{t('online')}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-status-offline"></div>
                        <span className="text-2xl font-bold text-foreground">{t('offline')}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-bot-activity">
                    {botStatus?.status || "Spielt Hamburg Response Network (HRN)"}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-uptime">
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('uptime')}</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-2" data-testid="text-uptime">
                    {botStatus?.uptime ? formatUptime(botStatus.uptime) : "0m"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('active_since_start', 'Seit Start aktiv')}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-servers">
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('servers')}</CardTitle>
                  <Server className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-2" data-testid="text-server-count">
                    {botStatus?.serverCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('connected_servers', 'Verbundene Server')}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-version">
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('version')}</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-2" data-testid="text-version">
                    {botStatus?.version || "1.0.0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('current_bot_version', 'Aktuelle Bot-Version')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('bot_info')}</CardTitle>
                <CardDescription>
                  {t('bot_details_desc', 'Details zum Emergency Assistant Discord-Bot')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Bot Name</p>
                    <p className="text-sm text-muted-foreground">Emergency Assistant</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{t('servers')}</p>
                    <p className="text-sm text-muted-foreground">Emergency Hamburg RP Server</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{t('available_commands', 'Verfügbare Befehle')}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">/bewerbung</Badge>
                      <Badge variant="secondary" className="text-xs">/hilfe</Badge>
                      <Badge variant="secondary" className="text-xs">/ping</Badge>
                      <Badge variant="secondary" className="text-xs">/ankündigung</Badge>
                      <Badge variant="secondary" className="text-xs">/info</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Portal-URL</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://your-repl.replit.app'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
