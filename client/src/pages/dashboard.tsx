import { useState, useRef } from "react";
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
  Music,
  Link,
  Upload,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotStatus } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  // States für Voice Join
  const [targetChannelId, setTargetChannelId] = useState("1471577369440686429");

  // States für Audio
  const [audioChannelId, setAudioChannelId] = useState("1471577369440686429");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States für Reaktionen
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
        channelId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Erfolg", description: "Bot ist dem Sprachkanal beigetreten." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Mutation: Audio via URL abspielen
  const playUrlMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/voice/play-url", {
        channelId: audioChannelId,
        url: audioUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio gestartet", description: "Der Bot spielt jetzt Audio ab." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Mutation: Audio via Datei abspielen
  const playFileMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile) throw new Error("Keine Datei ausgewählt");
      const formData = new FormData();
      formData.append("channelId", audioChannelId);
      formData.append("audio", audioFile);
      const res = await fetch("/api/discord/voice/play-file", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload fehlgeschlagen");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio gestartet", description: "Datei wird im Sprachkanal abgespielt." });
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Mutation: Audio stoppen
  const stopAudioMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/discord/voice/stop", {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Audio gestoppt", description: "Die Wiedergabe wurde beendet." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  // Mutation für Reaktionen
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
      toast({ title: "Reaktion gesendet", description: "Das Emoji wurde erfolgreich hinzugefügt." });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
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
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
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
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.uptime ? formatUptime(botStatus.uptime) : "0m"}
                  </div>
                  <p className="text-xs text-muted-foreground">Since last restart</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-medium">Servers</CardTitle>
                  <Server className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {botStatus?.serverCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Connected Guilds</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
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
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="input-voice-channel-id"
                      placeholder="Voice Channel ID"
                      value={targetChannelId}
                      onChange={(e) => setTargetChannelId(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    data-testid="button-join-voice"
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

              {/* Reaktions-Steuerung */}
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
                        data-testid="input-react-channel-id"
                        placeholder="Channel ID"
                        value={reactChannelId}
                        onChange={(e) => setReactChannelId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-react-message-id"
                        placeholder="Message ID"
                        value={reactMessageId}
                        onChange={(e) => setReactMessageId(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <SmilePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-react-emoji"
                        placeholder="Emoji (z.B. <:name:id>)"
                        value={reactEmoji}
                        onChange={(e) => setReactEmoji(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="button-add-reaction"
                    onClick={() => addReactionMutation.mutate()}
                    disabled={
                      addReactionMutation.isPending ||
                      !reactMessageId ||
                      !reactChannelId
                    }
                    className="w-full gap-2"
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

            {/* Audio Wiedergabe */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Audio Wiedergabe
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Spiele Audio im Sprachkanal ab – per URL oder Datei-Upload
                    </CardDescription>
                  </div>
                  <Button
                    data-testid="button-stop-audio"
                    variant="destructive"
                    onClick={() => stopAudioMutation.mutate()}
                    disabled={stopAudioMutation.isPending}
                    className="gap-2"
                  >
                    {stopAudioMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <StopCircle className="w-4 h-4" />
                    )}
                    Stopp
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-audio-channel-id"
                    placeholder="Voice Channel ID"
                    value={audioChannelId}
                    onChange={(e) => setAudioChannelId(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Tabs defaultValue="url">
                  <TabsList className="w-full">
                    <TabsTrigger value="url" className="flex-1 gap-2">
                      <Link className="w-4 h-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex-1 gap-2">
                      <Upload className="w-4 h-4" />
                      Datei-Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-3 pt-3">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        YouTube, SoundCloud oder direkte Audio-URL (mp3, ogg, wav …)
                      </Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          data-testid="input-audio-url"
                          placeholder="https://..."
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Button
                      data-testid="button-play-url"
                      onClick={() => playUrlMutation.mutate()}
                      disabled={playUrlMutation.isPending || !audioUrl || !audioChannelId}
                      className="w-full gap-2"
                    >
                      {playUrlMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Music className="w-4 h-4" />
                      )}
                      URL abspielen
                    </Button>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-3 pt-3">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        Audiodatei hochladen (mp3, ogg, wav, flac, m4a, webm · max. 50 MB)
                      </Label>
                      <Input
                        data-testid="input-audio-file"
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.ogg,.wav,.flac,.m4a,.webm"
                        onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    {audioFile && (
                      <p className="text-xs text-muted-foreground">
                        Ausgewählt: <span className="font-medium text-foreground">{audioFile.name}</span>{" "}
                        ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <Button
                      data-testid="button-play-file"
                      onClick={() => playFileMutation.mutate()}
                      disabled={playFileMutation.isPending || !audioFile || !audioChannelId}
                      className="w-full gap-2"
                    >
                      {playFileMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Datei abspielen
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
