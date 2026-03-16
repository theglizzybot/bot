import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { Send, Loader2, Info, User, Hash, Trash2 } from "lucide-react";
import type { DiscordServer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = z.object({
  type: z.enum(["channel", "dm"]).default("channel"),
  serverId: z.string().optional(),
  channelId: z.string().optional(),
  userId: z.string().optional(),
  replyTo: z.string().optional(),
  content: z.string().max(2000, "Message is too long").optional(),
  useEmbed: z.boolean().default(false),
  embedTitle: z.string().optional(),
  embedDescription: z.string().optional(),
  embedColor: z.string().default("#d32f2f"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SendMessagePage() {
  const { toast } = useToast();
  const [selectedServer, setSelectedServer] = useState<string>("");

  const { data: servers, isLoading: serversLoading } = useQuery<
    DiscordServer[]
  >({
    queryKey: ["/api/discord/servers"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "channel",
      serverId: "",
      channelId: "",
      userId: "",
      replyTo: "",
      content: "",
      useEmbed: false,
      embedTitle: "",
      embedDescription: "",
      embedColor: "#d32f2f",
    },
  });

  const messageType = form.watch("type");

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const endpoint =
        data.type === "dm"
          ? "/api/discord/send-dm"
          : "/api/discord/send-message";
      const payload: any = {
        content: data.content,
        replyTo: data.replyTo,
        ...(data.type === "dm"
          ? { userId: data.userId }
          : { channelId: data.channelId }),
      };

      if (data.useEmbed) {
        payload.embed = {
          title: data.embedTitle,
          description: data.embedDescription,
          color: data.embedColor,
        };
      }
      return await apiRequest("POST", endpoint, payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Message sent successfully!" });
      form.reset({
        ...form.getValues(),
        content: "",
        embedTitle: "",
        embedDescription: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (data: { channelId: string; messageId: string }) => {
      return await apiRequest(
        "DELETE",
        `/api/discord/messages/${data.channelId}/${data.messageId}`,
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message deleted successfully!",
      });
      form.setValue("userId", ""); // Reusing as messageId field for simplicity if needed, or just clear custom inputs
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message.",
        variant: "destructive",
      });
    },
  });

  const selectedServerData = servers?.find((s) => s.id === selectedServer);
  const availableChannels =
    selectedServerData?.channels.filter((c) => c.type === 0 || c.type === 5) ||
    [];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Send Message</h1>
          <p className="text-sm text-muted-foreground">
            Broadcast to channels or slide into DMs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Message Composer</CardTitle>
            <CardDescription>
              Select your destination and craft your message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  sendMessageMutation.mutate(data),
                )}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel>Message Destination</FormLabel>
                        <FormDescription>
                          {field.value === "channel"
                            ? "Sending to a Server Channel"
                            : "Sending a Direct Message"}
                        </FormDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={
                            field.value === "channel" ? "default" : "outline"
                          }
                          onClick={() => field.onChange("channel")}
                          size="sm"
                        >
                          <Hash className="w-4 h-4 mr-1" /> Channel
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "dm" ? "default" : "outline"}
                          onClick={() => field.onChange("dm")}
                          size="sm"
                        >
                          <User className="w-4 h-4 mr-1" /> DM
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                {messageType === "channel" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serverId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val);
                                setSelectedServer(val);
                                form.setValue("channelId", "");
                              }}
                              disabled={serversLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Server" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {servers?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="channelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Channel</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              disabled={!selectedServer}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Channel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableChannels.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    # {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="replyTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply to Message ID (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 123456789012345678"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            If provided, the bot will reply to this message.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Discord ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 123456789012345678"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The bot must share a server with the user.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your message here..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 flex-wrap gap-y-1">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>User: <code className="bg-muted px-1 rounded">&lt;@USER_ID&gt;</code></span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>Rolle: <code className="bg-muted px-1 rounded">&lt;@&amp;ROLLEN_ID&gt;</code></span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>Kanal: <code className="bg-muted px-1 rounded">&lt;#KANAL_ID&gt;</code></span>
                        </div>
                        <span className="shrink-0">{field.value?.length || 0} / 2000</span>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t space-y-4">
                  <FormField
                    control={form.control}
                    name="useEmbed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Rich Embed</FormLabel>
                          <FormDescription>
                            Format message as a Discord Embed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
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
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Embed Title" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="embedDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Embed Description"
                                {...field}
                              />
                            </FormControl>
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
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : (
                    <Send className="mr-2 w-4 h-4" />
                  )}
                  Send Message
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Message</CardTitle>
            <CardDescription>
              Format: [ChannelID]-[MessageID] (e.g. 1443318323017420891-1471981340231467101)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Combined ID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ChannelID-MessageID"
                    onChange={(e) => form.setValue("userId", e.target.value)}
                    value={form.watch("userId")}
                    data-testid="input-delete-combined-id"
                  />
                  <Button
                    variant="destructive"
                    className="shrink-0"
                    onClick={() => {
                      const combinedId = form.getValues("userId");
                      if (!combinedId || !combinedId.includes("-")) {
                        toast({
                          title: "Error",
                          description: "Please enter ID in format: ChannelID-MessageID",
                          variant: "destructive",
                        });
                        return;
                      }
                      const [channelId, messageId] = combinedId.split("-");
                      if (!channelId || !messageId) {
                        toast({
                          title: "Error",
                          description: "Invalid format. Use: ChannelID-MessageID",
                          variant: "destructive",
                        });
                        return;
                      }
                      deleteMessageMutation.mutate({ channelId, messageId });
                    }}
                    disabled={deleteMessageMutation.isPending}
                    data-testid="button-delete-message-combined"
                  >
                    {deleteMessageMutation.isPending ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
