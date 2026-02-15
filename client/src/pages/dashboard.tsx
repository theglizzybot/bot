import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Server,
  FileText,
  Clock,
  Volume2,
  Loader2,
  Hash,
  SmilePlus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotStatus } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  // States für Voice
  const [targetChannelId, setTargetChannelId] = useState("1471577369440686429");

  // NEU: States für Reaktionen
  const [reactChannelId, setReactChannelId] = useState("");
  const [reactMessageId, setReactMessageId] = useState("");
  const [reactEmoji, setReactEmoji] = useState(
    "<:music_disc:1471990618828837139>",
  );

  const { data: botStatus, isLoading } = useQuery<BotStatus>({
    queryKey: ["/api/bot/status"],
  });

  // Mutation für Voice Join
  const joinVoiceMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await apiRequest("POST", "/api/discord/voice/join", {
        channelId: channelId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: `Bot ist dem Sprachkanal beigetreten.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // NEU: Mutation für Reaktionen
  const addReactionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/messages/react", {
        channelId: reactChannelId,
        messageId: reactMessageId,
        emoji: reactEmoji,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reaktion gesendet",
        description: "Das Emoji wurde erfolgreich zur Nachricht hinzugefügt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time status of your Minecraft Discord Bot
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${botStatus?.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <span className="text-2xl font-bold">
                      {botStatus?.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {botStatus?.status || "Switching Activities"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.uptime ? formatUptime(botStatus.uptime) : "0m"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Since last restart
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Servers</CardTitle>
                  <Server className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.serverCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connected Guilds
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Version</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.version || "1.0.0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Stable Build</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Sprachchat Steuerung */}
              <Card>
                <CardHeader>
                  <CardTitle>Sprachchat Steuerung</CardTitle>
                  <CardDescription>
                    Gib eine Channel ID ein, um den Bot zu verbinden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Voice Channel ID"
                      value={targetChannelId}
                      onChange={(e) => setTargetChannelId(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => joinVoiceMutation.mutate(targetChannelId)}
                    disabled={joinVoiceMutation.isPending || !targetChannelId}
                    className="w-full gap-2"
                  >
                    {joinVoiceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    Sprachkanal beitreten
                  </Button>
                </CardContent>
              </Card>

              {/* NEU: Reaktions-Steuerung */}
              <Card>
                <CardHeader>
                  <CardTitle>Reaktions-Steuerung</CardTitle>
                  <CardDescription>
                    Lasse den Bot auf eine bestimmte Nachricht reagieren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Channel ID"
                        value={reactChannelId}
                        onChange={(e) => setReactChannelId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Message ID"
                        value={reactMessageId}
                        onChange={(e) => setReactMessageId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <SmilePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Emoji (z.B. <:name:id>)"
                        value={reactEmoji}
                        onChange={(e) => setReactEmoji(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => addReactionMutation.mutate()}
                    disabled={
                      addReactionMutation.isPending ||
                      !reactMessageId ||
                      !reactChannelId
                    }
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {addReactionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SmilePlus className="w-4 h-4" />
                    )}
                    Emoji hinzufügen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
