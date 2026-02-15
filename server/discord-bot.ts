import {
  Client,
  GatewayIntentBits,
  ActivityType,
  PermissionFlagsBits,
  REST,
  Routes,
  ApplicationCommandOptionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Partials,
  ChannelType,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { storage } from "./storage";

export class DiscordBot {
  private client: Client | null = null;
  private startTime: number = 0;
  private ready: boolean = false;

  async initialize() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;

      if (!token) {
        throw new Error("DISCORD_BOT_TOKEN is not set");
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages,
        ],
        partials: [Partials.Channel],
      });

      this.startTime = Date.now();

      this.client.once("ready", async () => {
        console.log(`✅ Discord Bot logged in as ${this.client?.user?.tag}`);
        this.ready = true;

        // --- AUTOMATIC SETUP FOR AUTOMOD BADGE (100 RULES) ---
        try {
          const guilds = await this.client?.guilds.fetch();
          if (guilds) {
            console.log(
              `⏳ Starting AutoMod-Badge Booster on ${guilds.size} servers...`,
            );

            for (const [guildId, partialGuild] of Array.from(guilds)) {
              const guild = await partialGuild.fetch();

              // Creates up to 10 rules per server to reach the 100-rule goal
              for (let i = 1; i <= 10; i++) {
                try {
                  const ruleName = `Badge Booster Filter ${i}`;
                  const existingRules = await guild.autoModerationRules.fetch();

                  if (!existingRules.some((r: any) => r.name === ruleName)) {
                    await guild.autoModerationRules.create({
                      name: ruleName,
                      enabled: true,
                      eventType: 1, // MessageSend
                      triggerType: 1, // Keyword
                      triggerMetadata: {
                        keywordFilter: [`badword${i}`, `spam${i}`],
                      },
                      actions: [{ type: 1 }], // BlockMessage
                      reason: "Automatic Badge Booster",
                    });
                  }
                } catch (e) {
                  // If limit reached or permissions missing, move to next server
                  break;
                }
              }
            }
            console.log(
              "🚀 AutoMod rules successfully processed in the background.",
            );
          }
        } catch (error) {
          console.error("❌ Error during automatic badge setup:", error);
        }

        const activities = [
          { name: "Minecraft Classic", type: ActivityType.Playing },
          { name: "Minecraft", type: ActivityType.Playing },
        ];
        let current = 0;

        setInterval(() => {
          if (!this.client?.user) return;

          this.client.user.setPresence({
            activities: [activities[current]],
            status: "online",
          });

          current = (current + 1) % activities.length;
        }, 10000);

        await this.registerCommands();
      });

      this.client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
          await this.handleCommand(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.handleModalSubmit(interaction);
        }
      });

      this.client.on("messageCreate", async (message) => {
        console.log(
          `📩 Message received: "${message.content}" in channel: ${message.channelId}`,
        );
        if (message.author.bot || !message.guild) return;

        const excludedChannelIds = [
          "1469462344127086612",
          "1469462378402807982",
        ];
        if (excludedChannelIds.includes(message.channelId)) {
          console.log(`🚫 Channel ${message.channelId} is excluded.`);
          return;
        }

        const content = message.content.toLowerCase().trim();
        const greetings = ["hi", "hallo", "hello", "hey", "moin", "servus"];

        const isGreeting = greetings.some((g) => {
          const regex = new RegExp(`^${g}\\b`, "i");
          return regex.test(content);
        });

        if (isGreeting) {
          console.log(
            `👋 Greeting recognized! Replying to ${message.author.username}`,
          );
          try {
            await message.reply(`Hello, ${message.author}`);
          } catch (error) {
            console.error("❌ Error replying to greeting:", error);
          }
        }
      });

      await this.client.login(token);
    } catch (error) {
      console.error("❌ Error initializing Discord Bot:", error);
      throw error;
    }
  }

  private async registerCommands() {
    if (!this.client?.user || !this.client.application) return;

    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_BOT_TOKEN!,
    );

    try {
      const existingCommands = (await rest.get(
        Routes.applicationCommands(this.client.application.id),
      )) as any[];

      const commands = [
        { name: "ping", description: "Checks if the bot is online", type: 1 },
        {
          name: "help",
          description: "Displays all available commands",
          type: 1,
        },
        {
          name: "info",
          description: "Displays bot information and portal link",
          type: 1,
        },
        {
          name: "application",
          description: "Start an application for the server",
          type: 1,
        },
        {
          name: "announcement",
          description: "Sends an announcement to the current channel",
          type: 1,
          options: [
            {
              name: "message",
              type: ApplicationCommandOptionType.String,
              description: "The message to be sent",
              required: true,
            },
          ],
        },
        {
          name: "startup",
          description: "Sends the start message manually (admins only)",
          type: 1,
        },
      ];

      const specialCommands = existingCommands.filter((cmd) => cmd.type === 4);

      const finalCommands = [
        ...commands,
        ...specialCommands.map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          type: cmd.type,
          options: cmd.options,
        })),
      ];

      await rest.put(Routes.applicationCommands(this.client.application.id), {
        body: finalCommands,
      });
      console.log("✅ Slash commands successfully registered");
    } catch (error) {
      console.error("❌ Error registering commands:", error);
    }
  }

  private async handleCommand(interaction: any) {
    const { commandName } = interaction;
    const authorizedRoles = [
      "1469467601792008318",
      "1471610494421962845",
      "1471156629604143276",
      "1471947255161553090",
    ];

    try {
      switch (commandName) {
        case "ping":
          await interaction.reply({
            content: "🏓 Pong! The bot is online and ready to use.",
            ephemeral: true,
          });
          break;

        case "help":
          const helpEmbed = {
            color: 0xd32f2f,
            title: "/help - commands",
            description: "Here is an overview of all available commands:",
            fields: [
              { name: "/ping", value: "Checks connectivity", inline: false },
              { name: "/info", value: "Bot details", inline: false },
              {
                name: "/application",
                value: "Start a role application",
                inline: false,
              },
              {
                name: "/announcement",
                value: "Send announcements",
                inline: false,
              },
            ],
            footer: { text: "Minecraft" },
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
          break;

        case "info":
          const infoEmbed = {
            color: 0x1976d2,
            title: "Minecraft Bot Info",
            fields: [
              { name: "📊 Status", value: "Online", inline: true },
              { name: "📝 Version", value: "23.5.1", inline: true },
              { name: "⏱️ Uptime", value: this.getUptime(), inline: true },
            ],
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
          break;

        case "application":
          const modal = new ModalBuilder()
            .setCustomId("application-process")
            .setTitle("Minecraft Server Application");

          const categoryInput = new TextInputBuilder()
            .setCustomId("category")
            .setLabel("Application Type")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Admin or Member application")
            .setRequired(true);

          const contentInput = new TextInputBuilder()
            .setCustomId("content")
            .setLabel("Application Text")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Write your application here...")
            .setRequired(true)
            .setMinLength(50);

          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              categoryInput,
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              contentInput,
            ),
          );
          await interaction.showModal(modal);
          break;

        case "announcement":
          if (
            !interaction.member.roles.cache.some((r: any) =>
              authorizedRoles.includes(r.id),
            )
          ) {
            return interaction.reply({
              content: "❌ No permission.",
              ephemeral: true,
            });
          }
          const messageStr = interaction.options.getString("message");
          await interaction.channel.send({
            embeds: [
              {
                color: 0xd32f2f,
                title: "📢 Announcement",
                description: messageStr,
                footer: { text: `Sent by ${interaction.user.tag}` },
                timestamp: new Date().toISOString(),
              },
            ],
          });
          await interaction.reply({ content: "✅ Sent.", ephemeral: true });
          break;

        case "startup":
          if (
            !interaction.member.roles.cache.some((r: any) =>
              authorizedRoles.includes(r.id),
            )
          ) {
            return interaction.reply({
              content: "❌ No permission.",
              ephemeral: true,
            });
          }
          await this.sendStartupMessage();
          await interaction.reply({
            content: "✅ Startup message sent.",
            ephemeral: true,
          });
          break;
      }
    } catch (error) {
      console.error("❌ Command Error:", error);
    }
  }

  private async handleModalSubmit(interaction: any) {
    if (interaction.customId === "application-process") {
      try {
        const category = interaction.fields.getTextInputValue("category");
        const content = interaction.fields.getTextInputValue("content");

        await storage.createApplication({
          discordName: interaction.user.tag,
          discordId: interaction.user.id,
          category,
          content,
          status: "New",
        });

        await interaction.reply({
          content: "✅ Your application has been saved successfully!",
          ephemeral: true,
        });
      } catch (error) {
        console.error("❌ Application Error:", error);
      }
    }
  }

  private async sendStartupMessage() {
    try {
      this.client?.guilds.cache.forEach(async (guild) => {
        const channel = guild.channels.cache.find(
          (ch: any) =>
            ch.type === 0 &&
            ch
              .permissionsFor(guild.members.me!)
              ?.has(PermissionFlagsBits.SendMessages),
        );
        if (channel) {
          await (channel as any).send({
            embeds: [
              {
                color: 0x4caf50,
                title: "Minecraft Bot is online!",
                description: "The system is now ready.",
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      });
    } catch (error) {
      console.error("❌ Startup Error:", error);
    }
  }

  // --- DASHBOARD & SEND MESSAGE SYSTEM ---

  getUptime(): string {
    const seconds = Math.floor((Date.now() - this.startTime) / 1000);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  getStatus() {
    return {
      online: this.ready,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: "23.5.1",
      serverCount: this.client?.guilds.cache.size || 0,
      status: "Switches automatically",
      startTime: this.startTime,
    };
  }

  getServers() {
    if (!this.client) return [];

    return this.client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      channels: guild.channels.cache
        .filter((ch: any) => ch.type === 0 || ch.type === 2 || ch.type === 5)
        .map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          position: ch.position,
        }))
        .sort((a, b) => a.position - b.position),
    }));
  }

  async sendMessage(
    channelId: string,
    options: {
      content?: string;
      embed?: { title?: string; description?: string; color?: string };
    },
  ) {
    if (!this.client) throw new Error("Bot is not initialized.");

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !("send" in channel)) {
      throw new Error("Channel not found or no permission to send.");
    }

    const sendOptions: any = {};
    if (options.content) sendOptions.content = options.content;
    if (options.embed) {
      sendOptions.embeds = [
        {
          title: options.embed.title,
          description: options.embed.description,
          color: options.embed.color
            ? parseInt(options.embed.color.replace("#", ""), 16)
            : 0xd32f2f,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    await (channel as any).send(sendOptions);
  }

  async createInvite(serverId: string) {
    if (!this.client) return null;
    try {
      const guild = await this.client.guilds.fetch(serverId);
      const channels = await guild.channels.fetch();
      // Use ChannelType to filter for text channels
      const textChannel = channels.find((c: any) => c?.type === 0); // 0 is GuildText

      if (!textChannel || !("createInvite" in textChannel)) {
        throw new Error("No text channel found for invite");
      }

      const invite = await (textChannel as any).createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true,
      });

      return invite.url;
    } catch (error) {
      console.error(`❌ Error creating invite for ${serverId}:`, error);
      throw error;
    }
  }

  // NEW: Direct Message functionality
  async sendDirectMessage(
    userId: string,
    options: {
      content?: string;
      embed?: { title?: string; description?: string; color?: string };
    },
  ) {
    if (!this.client) throw new Error("Bot is not initialized.");

    try {
      const user = await this.client.users.fetch(userId);
      const sendOptions: any = {};

      if (options.content) sendOptions.content = options.content;
      if (options.embed) {
        sendOptions.embeds = [
          {
            title: options.embed.title,
            description: options.embed.description,
            color: options.embed.color
              ? parseInt(options.embed.color.replace("#", ""), 16)
              : 0x1976d2,
            timestamp: new Date().toISOString(),
          },
        ];
      }

      await user.send(sendOptions);
      return { success: true };
    } catch (error) {
      console.error("❌ Error sending DM:", error);
      throw new Error("Could not send DM (User might have DMs disabled).");
    }
  }

  async joinVoice(channelId: string) {
    if (!this.client) throw new Error("Bot is not initialized.");

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        throw new Error("Voice channel not found or invalid type.");
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: (channel as any).guild.id,
        adapterCreator: (channel as any).guild.voiceAdapterCreator,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`✅ Joined voice channel: ${channel.name}`);
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Error joining voice:", error);
      throw error;
    }
  }

  async deleteMessage(channelId: string, messageId: string) {
    if (!this.client) throw new Error("Bot is not initialized.");

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !("messages" in channel)) {
        throw new Error("Channel not found or does not support messages.");
      }

      const message = await (channel as any).messages.fetch(messageId);
      if (!message) {
        throw new Error("Message not found.");
      }

      await message.delete();
      return { success: true };
    } catch (error: any) {
      console.error("❌ Error deleting message:", error);
      throw new Error(error.message || "Could not delete message.");
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}

export const discordBot = new DiscordBot();
