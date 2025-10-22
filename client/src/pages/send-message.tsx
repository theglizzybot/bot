import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import type { DiscordServer } from "@shared/schema";
import { sendMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = sendMessageSchema.extend({
  serverId: z.string().min(1, "Server ist erforderlich"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SendMessagePage() {
  const { toast } = useToast();
  const [selectedServer, setSelectedServer] = useState<string>("");

  const { data: servers, isLoading: serversLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverId: "",
      channelId: "",
      content: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { channelId, content } = data;
      return await apiRequest("POST", "/api/discord/send-message", { channelId, content });
    },
    onSuccess: () => {
      toast({
        title: "Nachricht gesendet",
        description: "Die Nachricht wurde erfolgreich an den Discord-Kanal gesendet.",
      });
      form.reset();
      setSelectedServer("");
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

  const onSubmit = (data: FormValues) => {
    sendMessageMutation.mutate(data);
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="serverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server auswählen</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedServer(value);
                          form.setValue("channelId", "");
                        }}
                        disabled={serversLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-server">
                            <SelectValue placeholder="Server auswählen..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servers?.map((server) => (
                            <SelectItem 
                              key={server.id} 
                              value={server.id}
                              data-testid={`option-server-${server.id}`}
                            >
                              {server.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kanal auswählen</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedServer || availableChannels.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-channel">
                            <SelectValue placeholder="Kanal auswählen..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableChannels.map((channel) => (
                            <SelectItem 
                              key={channel.id} 
                              value={channel.id}
                              data-testid={`option-channel-${channel.id}`}
                            >
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachricht</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Geben Sie Ihre Nachricht ein..."
                          rows={8}
                          maxLength={2000}
                          className="resize-none"
                          data-testid="input-message"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground text-right">
                        {field.value.length} / 2000 Zeichen
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendMessageMutation.isPending}
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
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
