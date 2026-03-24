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
  EmbedBuilder,
} from "discord.js";
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  entersState,
} from "@discordjs/voice";
import playdl from "play-dl";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

import { execSync } from "child_process";

(function detectFfmpeg() {
  try {
    const found = execSync("which ffmpeg", { encoding: "utf8" }).trim();
    if (found) {
      console.log("✅ FFmpeg gefunden:", found);
      return;
    }
  } catch {}
  console.warn(
    "⚠️ FFmpeg nicht gefunden — Audio-Wiedergabe funktioniert möglicherweise nicht",
  );
})();

export class DiscordBot {
  private client: Client | null = null;
  private startTime: number = 0;
  private ready: boolean = false;
  private audioPlayer: ReturnType<typeof createAudioPlayer> | null = null;

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
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildMembers,
        ],
        partials: [
          Partials.Channel,
          Partials.Message,
          Partials.Reaction,
          Partials.GuildMember,
        ],
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

              for (let i = 1; i <= 10; i++) {
                try {
                  const ruleName = `Badge Booster Filter ${i}`;
                  const existingRules = await guild.autoModerationRules.fetch();

                  if (!existingRules.some((r: any) => r.name === ruleName)) {
                    await guild.autoModerationRules.create({
                      name: ruleName,
                      enabled: true,
                      eventType: 1,
                      triggerType: 1,
                      triggerMetadata: {
                        keywordFilter: [`badword${i}`, `spam${i}`],
                      },
                      actions: [{ type: 1 }],
                      reason: "Automatic Badge Booster",
                    });
                  }
                } catch (e) {
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

      // --- AUTO WELCOME NEW MEMBERS ---
      this.client.on("guildMemberAdd", async (member) => {
        try {
          const guild = member.guild;
          // Find a system channel or first available text channel
          const WELCOME_CHANNEL_ID = "1483495498470920406";
          const welcomeChannel =
            guild.channels.cache.get(WELCOME_CHANNEL_ID) ||
            guild.systemChannel ||
            guild.channels.cache.find(
              (ch: any) =>
                ch.type === 0 &&
                ch
                  .permissionsFor(guild.members.me!)
                  ?.has(PermissionFlagsBits.SendMessages),
            );

          if (welcomeChannel && "send" in welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
              .setColor(0xd32f2f)
              .setTitle("Welcome to the server!")
              .setDescription(
                `Welcome, ${member}! We're glad to have you here. Feel free to look around and have fun! Don't forget:
📜 Look at the rules in ⁠<#1469464292049948785> 
💬 Meet the community in ⁠<#1469462133095006289>
🎧 Chat with us in calls 
`,
              )
              .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: guild.name,
                iconURL: guild.iconURL() ?? undefined,
              })
              .setTimestamp();

            await (welcomeChannel as any).send({ embeds: [welcomeEmbed] });
          }
        } catch (error) {
          console.error("❌ Error sending welcome message:", error);
        }
      });

      this.client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
          await this.handleCommand(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.handleModalSubmit(interaction);
        }
      });

      this.client.on("messageCreate", async (message) => {
        if (message.author.bot || !message.guild) return;

        // --- AUTOMATISCHE REAKTIONEN FÜR SPEZIFISCHEN CHANNEL ---
        const reactionChannelId = "1472714775308927151";
        if (message.channelId === reactionChannelId) {
          try {
            const freshMsg = await message.fetch(true).catch(() => message);
            for (const emojiId of [
              "1471991013928206469",
              "1472714251385835690",
            ]) {
              const alreadyReacted = freshMsg.reactions.cache.some(
                (r) => r.emoji.id === emojiId && r.me,
              );
              if (!alreadyReacted) {
                await message.react(emojiId);
              }
            }
          } catch (error) {
            console.error("❌ Fehler beim Hinzufügen der Reaktionen:", error);
          }
        }

        // --- AUTOMATISCHE REAKTIONEN FÜR SPEZIFISCHE USER ---
        const userReactions: Record<string, string[]> = {
          "1242531438524367002": ["1471991880932917379", "1473021572498325772"],
          "1464349872730935537": [
            "1471991880932917379",
            "1471991969642184957",
            "1471988379347583119",
          ],
          "1437203189651865643": [
            "1473021649178726560",
            "1473021572498325772",
            "1472699457760919593",
          ],
          "1297267934908907622": [
            "1471991969642184957",
            "1471991880932917379",
            "1471989978216141044",
          ],
        };

        if (userReactions[message.author.id]) {
          const freshMsg = await message.fetch(true).catch(() => message);
          for (const emojiId of userReactions[message.author.id]) {
            try {
              const alreadyReacted = freshMsg.reactions.cache.some(
                (r) => r.emoji.id === emojiId && r.me,
              );
              if (!alreadyReacted) {
                await message.react(emojiId);
              }
            } catch (error) {
              console.error(`❌ Error reacting with ${emojiId}:`, error);
            }
          }
        }

        // --- KANAL-AUSSCHLÜSSE für Gruß-Logik ---
        const excludedChannelIds = [
          "1469462344127086612",
          "1469462378402807982",
          "1472558854775636111",
        ];
        if (excludedChannelIds.includes(message.channelId)) return;

        const content = message.content.toLowerCase().trim();
        const greetings = [
          "hi",
          "hallo",
          "hello",
          "hey",
          "moin",
          "servus",
          "bonjour",
          "guten tag",
          "çau",
          "ciau",
          "hoi",
          "你好",
          "wilkommen",
          "willkommen",
          "welcome",
          "hiho",
          "heyho",
          "namaste",
          "helo",
          "hola",
          "hallo zusammen",
          "hallo alle",
          "labas",
          "sut",
          "sveiki",
          "sveikas",
          "labas rytas",
          "labas vakaras",
          "sveiki atvykę",
          "sveiki prisijungę",
          "☆: .｡. o(≧▽≦)o .｡.:☆",
          "namaste bro, kaseho?",
          "नमस्ते",
          "grüezi",
          "moin moin",
          "mahlzeit",
          "salut",
          "coucou",
          "allô",
          "ciao",
          "buongiorno",
          "salve",
          "¿qué tal?",
          "buenas",
          "buenos días",
          "olá",
          "oi",
          "bom dia",
          "goedendag",
          "hej",
          "tjena",
          "hallå",
          "hei",
          "terve",
          "cześć",
          "dzień dobry",
          "ahoj",
          "dobrý den",
          "szia",
          "heló",
          "buna",
          "geia",
          "yassas",
          "merhaba",
          "selam",
          "zdravstvuyte",
          "privet",
          "привет",
          "konnichiwa",
          "ohayou",
          "moshi moshi",
          "こんにちは",
          "annyeong",
          "annyeonghaseyo",
          "안녕하세요",
          "nǐ hǎo",
          "nǐ hǎo ma",
          "néih hóu",
          "xin chào",
          "sawatdee",
          "kumusta",
          "apa kabar",
          "aloha",
          "salam",
          "as-salaam-alaikum",
          "marhaba",
          "السلام عليكم",
          "shalom",
          "shaloam",
          "jambo",
          "habari",
          "sawubona",
          "yo",
          "sup",
          "howdy",
          "wassup",
          "wazzup",
          "zup",
          "greetings",
          "hiya",
          "heyy",
          "heyyy",
          "re",
          "back",
          "wb",
          "morning",
          "night",
          "evening",
          "gn",
          "gm",
          "morgen",
          "nabend",
          "tach",
          "yoo",
          "bruh",
          "mellon",
          "nuqneH",
          "live long and prosper",
          "may the force be with you",
          "hello there",
          "01001000 01101001",
          "ola",
          "hola",
        ];

        const isGreeting = greetings.some((g) => {
          if (g.includes("☆") || g.match(/^[01 ]+$/)) {
            return content.startsWith(g.toLowerCase());
          }
          const flexiblePattern = g
            .split("")
            .map((char) =>
              /[a-zA-Z]/.test(char) ? `${char.toLowerCase()}+` : `\\${char}`,
            )
            .join("");
          const regex = new RegExp(`^${flexiblePattern}\\b`, "i");
          return regex.test(content);
        });

        if (isGreeting) {
          if (message.channelId === "1472558854775636111") {
            try {
              await message.reply("The greeting already exists.");
            } catch (error) {
              console.error("❌ Error replying in special channel:", error);
            }
            return;
          }

          try {
            if ((message as any)._greetingReplied) return;
            (message as any)._greetingReplied = true;
            await message.reply(`Hello, ${message.author}`);
          } catch (error) {
            console.error("❌ Error replying to greeting:", error);
          }
          return;
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
        { name: "info", description: "Displays bot information", type: 1 },
        { name: "application", description: "Start an application", type: 1 },
        {
          name: "announcement",
          description: "Sends an announcement",
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
        { name: "startup", description: "Manual start message", type: 1 },
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
          await interaction.reply({ content: "🏓 Pong!", ephemeral: true });
          break;
        case "help":
          const helpEmbed = {
            color: 0xd32f2f,
            title: "/help - commands",
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
            .setTitle("Minecraft Application");
          const categoryInput = new TextInputBuilder()
            .setCustomId("category")
            .setLabel("Type")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          const contentInput = new TextInputBuilder()
            .setCustomId("content")
            .setLabel("Text")
            .setStyle(TextInputStyle.Paragraph)
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
          const msg = interaction.options.getString("message");
          await interaction.channel.send({
            embeds: [
              {
                color: 0xd32f2f,
                title: "📢 Announcement",
                description: msg,
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
          content: "✅ Application saved!",
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

  isReady(): boolean {
    return this.ready;
  }

  // --- DASHBOARD API FUNCTIONS ---

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

  getBotInfo() {
    if (!this.client?.user) return null;
    const user = this.client.user;
    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatarUrl: user.displayAvatarURL({ size: 256 }),
      bannerUrl: user.bannerURL({ size: 1024 }) ?? null,
    };
  }

  async setBotAvatar(imageUrl: string) {
    if (!this.client?.user) throw new Error("Bot is not initialized.");
    await this.client.user.setAvatar(imageUrl);
    return {
      success: true,
      avatarUrl: this.client.user.displayAvatarURL({ size: 256 }),
    };
  }

  async setBotBanner(imageUrl: string) {
    if (!this.client?.user) throw new Error("Bot is not initialized.");
    await this.client.user.setBanner(imageUrl);
    return {
      success: true,
      bannerUrl: this.client.user.bannerURL({ size: 1024 }) ?? null,
    };
  }

  async setServerNickname(guildId: string, nickname: string) {
    if (!this.client) throw new Error("Bot is not initialized.");
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error("Server not found.");
    await guild.members.me?.setNickname(nickname || null);
    return { success: true, nickname: nickname || null };
  }

  getServerNicknames() {
    if (!this.client) return {};
    const nicknames: Record<string, string | null> = {};
    this.client.guilds.cache.forEach((guild) => {
      nicknames[guild.id] = guild.members.me?.nickname ?? null;
    });
    return nicknames;
  }

  async sendMessage(
    channelId: string,
    options: {
      content?: string;
      embed?: {
        title?: string;
        description?: string;
        color?: string;
        footer?: { text?: string; iconUrl?: string };
        thumbnail?: string;
        image?: string;
        author?: { name?: string; url?: string; iconUrl?: string };
        fields?: { name: string; value: string; inline?: boolean }[];
        timestamp?: boolean;
      };
      replyTo?: string;
    },
  ) {
    if (!this.client) throw new Error("Bot is not initialized.");
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !("send" in channel)) throw new Error("Channel not found.");
    const sendOptions: any = {};
    if (options.content) sendOptions.content = options.content;
    if (options.replyTo)
      sendOptions.reply = {
        messageReference: options.replyTo,
        failIfNotExists: false,
      };
    if (options.embed) {
      const e = options.embed;
      const embedData: any = {
        color: e.color ? parseInt(e.color.replace("#", ""), 16) : 0xd32f2f,
      };
      if (e.title) embedData.title = e.title;
      if (e.description) embedData.description = e.description;
      if (e.thumbnail) embedData.thumbnail = { url: e.thumbnail };
      if (e.image) embedData.image = { url: e.image };
      if (e.author?.name) {
        embedData.author = {
          name: e.author.name,
          url: e.author.url || undefined,
          icon_url: e.author.iconUrl || undefined,
        };
      }
      if (e.footer?.text) {
        embedData.footer = {
          text: e.footer.text,
          icon_url: e.footer.iconUrl || undefined,
        };
      }
      if (e.fields && e.fields.length > 0) {
        embedData.fields = e.fields.map((f) => ({
          name: f.name,
          value: f.value,
          inline: f.inline ?? false,
        }));
      }
      if (e.timestamp) embedData.timestamp = new Date().toISOString();
      sendOptions.embeds = [embedData];
    }
    sendOptions.allowedMentions = { parse: ["roles", "users", "everyone"] };
    await (channel as any).send(sendOptions);
  }

  async sendDirectMessage(
    userId: string,
    options: {
      content?: string;
      embed?: {
        title?: string;
        description?: string;
        color?: string;
        footer?: { text?: string; iconUrl?: string };
        thumbnail?: string;
        image?: string;
        author?: { name?: string; url?: string; iconUrl?: string };
        fields?: { name: string; value: string; inline?: boolean }[];
        timestamp?: boolean;
      };
    },
  ) {
    if (!this.client) throw new Error("Bot is not initialized.");
    const user = await this.client.users.fetch(userId);
    const sendOptions: any = {};
    if (options.content) sendOptions.content = options.content;
    if (options.embed) {
      const e = options.embed;
      const embedData: any = {
        color: e.color ? parseInt(e.color.replace("#", ""), 16) : 0x1976d2,
      };
      if (e.title) embedData.title = e.title;
      if (e.description) embedData.description = e.description;
      if (e.thumbnail) embedData.thumbnail = { url: e.thumbnail };
      if (e.image) embedData.image = { url: e.image };
      if (e.author?.name) {
        embedData.author = {
          name: e.author.name,
          url: e.author.url || undefined,
          icon_url: e.author.iconUrl || undefined,
        };
      }
      if (e.footer?.text) {
        embedData.footer = {
          text: e.footer.text,
          icon_url: e.footer.iconUrl || undefined,
        };
      }
      if (e.fields && e.fields.length > 0) {
        embedData.fields = e.fields.map((f) => ({
          name: f.name,
          value: f.value,
          inline: f.inline ?? false,
        }));
      }
      if (e.timestamp) embedData.timestamp = new Date().toISOString();
      sendOptions.embeds = [embedData];
    }
    await user.send(sendOptions);
    return { success: true };
  }

  async deleteMessage(channelId: string, messageId: string) {
    if (!this.client) throw new Error("Bot is not initialized.");
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !("messages" in channel)) throw new Error("Channel error.");
    const message = await (channel as any).messages.fetch(messageId);
    await message.delete();
    return { success: true };
  }

  async addReaction(channelId: string, messageId: string, emoji: string) {
    if (!this.client) throw new Error("Bot is not initialized.");
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !("messages" in channel))
        throw new Error("Channel not found.");

      const message = await (channel as any).messages.fetch(messageId);
      if (!message) throw new Error("Message not found.");

      await message.react(emoji.trim());
      return { success: true };
    } catch (error: any) {
      console.error("❌ Error adding reaction:", error);
      throw new Error(error.message || "Could not add reaction.");
    }
  }

  async createInvite(serverId: string) {
    if (!this.client) return null;
    const guild = await this.client.guilds.fetch(serverId);
    const textChannel = (await guild.channels.fetch()).find(
      (c: any) => c?.type === 0,
    );
    if (!textChannel || !("createInvite" in textChannel))
      throw new Error("No channel found.");
    const invite = await (textChannel as any).createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: true,
    });
    return invite.url;
  }

  private async resolveVoiceChannel(channelId: string) {
    if (!this.client) throw new Error("Bot is not initialized.");
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice)
      throw new Error("Ungültiger Voice-Channel.");
    return channel;
  }

  async joinVoice(channelId: string) {
    const channel = await this.resolveVoiceChannel(channelId);
    const guild = (channel as any).guild;

    const existingConnection = getVoiceConnection(guild.id);
    if (existingConnection) existingConnection.destroy();

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (err) {
      connection.destroy();
      throw new Error("Could not connect to voice channel.");
    }

    this.audioPlayer = createAudioPlayer();
    connection.subscribe(this.audioPlayer);

    return { success: true };
  }

  async playAudio(channelId: string, source: string, isLocalFile: boolean) {
    await this.joinVoice(channelId);

    let resource;
    if (isLocalFile) {
      resource = createAudioResource(fs.createReadStream(source), {
        inputType: StreamType.Arbitrary,
      });
    } else {
      const stream = await playdl.stream(source);
      resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
    }

    if (!this.audioPlayer) throw new Error("Audio player not initialized.");
    this.audioPlayer.play(resource);

    return new Promise<{ success: boolean }>((resolve, reject) => {
      this.audioPlayer!.once(AudioPlayerStatus.Idle, () =>
        resolve({ success: true }),
      );
      this.audioPlayer!.once("error", reject);
    });
  }

  stopAudio() {
    if (!this.audioPlayer)
      return { success: false, message: "No audio playing." };
    this.audioPlayer.stop(true);
    return { success: true };
  }
}

export const discordBot = new DiscordBot();
