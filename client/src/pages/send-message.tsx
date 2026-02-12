import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Info } from "lucide-react";
import type { DiscordServer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  serverId: z.string().min(1, "Server ist erforderlich"),
  channelId: z.string().min(1, "Kanal-ID ist erforderlich"),
  content: z.string().max(2000, "Nachricht ist zu lang").optional(),
  useEmbed: z.boolean().default(false),
  embedTitle: z.string().optional(),
  embedDescription: z.string().optional(),
  embedColor: z.string().default("#d32f2f"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SendMessagePage() {
  const { toast } = useToast();
  const [selectedServer, setSelectedServer] = useState<string>("");
  const { t } = useTranslation();

  const { data: servers, isLoading: serversLoading } = useQuery<DiscordServer[]>({
    queryKey: ["/api/discord/servers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serverId: "",
      channelId: "",
      content: "",
      useEmbed: false,
      embedTitle: "",
      embedDescription: "",
      embedColor: "#d32f2f",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload: any = {
        channelId: data.channelId,
        content: data.content,
      };

      if (data.useEmbed) {
        payload.embed = {
          title: data.embedTitle,
          description: data.embedDescription,
          color: data.embedColor,
        };
      }

      return await apiRequest("POST", "/api/discord/send-message", payload);
    },
    onSuccess: () => {
      toast({
        title: t('message_sent', 'Nachricht gesendet'),
        description: t('message_sent_desc', 'Die Nachricht wurde erfolgreich an den Discord-Kanal gesendet.'),
      });
      form.reset();
      setSelectedServer("");
    },
    onError: (error: any) => {
      toast({
        title: t('error', 'Fehler'),
        description: error.message || t('message_send_failed', 'Die Nachricht konnte nicht gesendet werden.'),
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
    <div className="h-full overflow-y-auto">
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
                      <FormLabel>{t('message', 'Nachricht')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('message_placeholder', 'Geben Sie Ihre Nachricht ein...')}
                          rows={6}
                          maxLength={2000}
                          className="resize-none"
                          data-testid="input-message"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="w-3 h-3" />
                          <span>{t('mentions_hint', 'Mentions (@user), Channels (#channel) werden unterstützt')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {field.value?.length || 0} / 2000 Zeichen
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="useEmbed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('use_embed', 'Embed verwenden')}
                          </FormLabel>
                          <FormDescription>
                            {t('use_embed_desc', 'Nachricht als Discord Embed formatieren')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-use-embed"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("useEmbed") && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                      <FormField
                        control={form.control}
                        name="embedTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('embed_title', 'Embed Titel')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('title_placeholder', 'Titel eingeben...')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="embedDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('embed_description', 'Embed Beschreibung')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('desc_placeholder', 'Beschreibung eingeben...')} 
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="embedColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('embed_color', 'Embed Farbe')}</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 p-1 h-10" {...field} />
                                <Input value={field.value} onChange={field.onChange} className="flex-1" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

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
