import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import type { DiscordServer, SendMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SendMessagePage() {
  const { toast } = useToast();
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const { data: servers, isLoading: serversLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: SendMessage) => {
      return await apiRequest("POST", "/api/discord/send-message", data);
    },
    onSuccess: () => {
      toast({
        title: "Nachricht gesendet",
        description: "Die Nachricht wurde erfolgreich an den Discord-Kanal gesendet.",
      });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
    },
  });

  const selectedServerData = servers?.find((s) => s.id === selectedServer);
  const availableChannels = selectedServerData?.channels.filter((c) => c.type === 0 || c.type === 5) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !message.trim()) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte wählen Sie einen Kanal und geben Sie eine Nachricht ein.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      channelId: selectedChannel,
      content: message,
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Nachricht senden</h1>
          <p className="text-sm text-muted-foreground">
            Senden Sie Nachrichten direkt an Discord-Kanäle
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neue Nachricht</CardTitle>
            <CardDescription>
              Wählen Sie einen Server und Kanal aus, um eine Nachricht zu senden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="server">Server auswählen</Label>
                <Select
                  value={selectedServer}
                  onValueChange={(value) => {
                    setSelectedServer(value);
                    setSelectedChannel("");
                  }}
                  disabled={serversLoading}
                >
                  <SelectTrigger id="server" data-testid="select-server">
                    <SelectValue placeholder="Server auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servers?.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Kanal auswählen</Label>
                <Select
                  value={selectedChannel}
                  onValueChange={setSelectedChannel}
                  disabled={!selectedServer || availableChannels.length === 0}
                >
                  <SelectTrigger id="channel" data-testid="select-channel">
                    <SelectValue placeholder="Kanal auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServer && availableChannels.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Keine Text-Kanäle verfügbar auf diesem Server.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Nachricht</Label>
                <Textarea
                  id="message"
                  placeholder="Geben Sie Ihre Nachricht ein..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  maxLength={2000}
                  className="resize-none"
                  data-testid="input-message"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length} / 2000 Zeichen
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={sendMessageMutation.isPending || !selectedChannel || !message.trim()}
                data-testid="button-send"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Nachricht senden
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
