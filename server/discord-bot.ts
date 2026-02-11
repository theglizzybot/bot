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
} from "discord.js";
import { storage } from "./storage";

export class DiscordBot {
  private client: Client | null = null;
  private startTime: number = 0;
  private ready: boolean = false;

  async initialize() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;

      if (!token) {
        throw new Error("DISCORD_BOT_TOKEN ist nicht gesetzt");
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
        ],
      });

      this.startTime = Date.now();

      this.client.once("ready", async () => {
        console.log(`✅ Discord Bot eingeloggt als ${this.client?.user?.tag}`);
        this.ready = true;

        // Aktivitäten wechseln: Alex Gaming® ↔ Grenzen RP (GRP)
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
        }, 10000); // alle 10 Sekunden wechseln

        // Slash-Commands registrieren
        await this.registerCommands();

        // Automatische Startnachricht (deaktiviert)
        // await this.sendStartupMessage();
      });

      // Slash-Command Handler
      this.client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
          await this.handleCommand(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.handleModalSubmit(interaction);
        }
      });

      // Begrüßungs-Handler
      this.client.on("messageCreate", async (message) => {
        if (message.author.bot) return;
        if (!message.guild) return;

        const channel = message.channel as any;
        const channelName = channel.name?.toLowerCase() || "";

        // Ausgeschlossene Kanäle
        if (channelName.includes("bug-reports") || channelName.includes("suggestions")) {
          return;
        }

        const content = message.content.toLowerCase();
        const greetings = ["hi", "hallo", "hello", "hey", "moin", "servus"];

        if (greetings.some(g => content === g || content.startsWith(g + " "))) {
          try {
            await message.reply(`Hallo ${message.author.username}! 👋`);
          } catch (error) {
            console.error("❌ Fehler beim Antworten auf Begrüßung:", error);
          }
        }
      });

      await this.client.login(token);
    } catch (error) {
      console.error("❌ Fehler beim Initialisieren des Discord-Bots:", error);
      throw error;
    }
  }

  private async registerCommands() {
    if (!this.client?.user || !this.client.application) return;

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return;

    const rest = new REST({ version: "10" }).setToken(token);

    try {
      // First, fetch existing commands to see what's currently registered
      const existingCommands = await rest.get(
        Routes.applicationCommands(this.client.application.id)
      ) as any[];

      const commands = [
        {
          name: "ping",
          description: "Prüft ob der Bot online ist",
          type: 1,
        },
        {
          name: "hilfe",
          description: "Zeigt alle verfügbaren Befehle",
          type: 1,
        },
        {
          name: "info",
          description: "Zeigt Bot-Informationen und Portal-Link",
          type: 1,
        },
        {
          name: "bewerbung",
          description: "Startet eine Bewerbung für den Server",
          type: 1,
        },
        {
          name: "ankündigung",
          description:
            "Sendet eine Ankündigung in den aktuellen Kanal (nur für autorisierte Rollen)",
          type: 1,
          options: [
            {
              name: "nachricht",
              type: ApplicationCommandOptionType.String,
              description: "Die Nachricht die gesendet werden soll",
              required: true,
            },
          ],
        },
        {
          name: "startup",
          description: "Sendet die Startnachricht manuell (nur Admins)",
          type: 1,
        },
      ];

      // Check for 'Entry Point' commands (type 4) or other special commands
      // that Discord requires us to keep during a bulk update.
      const specialCommands = existingCommands.filter(cmd => cmd.type === 4);
      
      const finalCommands = [...commands, ...specialCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        type: cmd.type,
        options: cmd.options,
      }))];

      await rest.put(Routes.applicationCommands(this.client.application.id), {
        body: finalCommands,
      });
      console.log("✅ Slash-Commands erfolgreich registriert");
    } catch (error) {
      console.error("❌ Fehler beim Registrieren der Commands:", error);
    }
  }

  private async handleCommand(interaction: any) {
    const { commandName } = interaction;
    try {
      switch (commandName) {
        case "ping":
          await interaction.reply({
            content: "🏓 Pong! Der Bot ist online und einsatzbereit.",
            ephemeral: true,
          });
          break;

        case "hilfe":
          const helpEmbed = {
            color: 0xd32f2f,
            title: "/hilfe - Befehle",
            description: "Hier ist eine Übersicht aller verfügbaren Befehle:",
            fields: [
              {
                name: "/ping",
                value: "Prüft ob der Bot online ist",
                inline: false,
              },
              {
                name: "/hilfe",
                value: "Zeigt diese Befehlsübersicht",
                inline: false,
              },
              {
                name: "/info",
                value: "Zeigt Bot-Informationen und Portal-Link",
                inline: false,
              },
              {
                name: "/bewerbung",
                value: "Startet eine Bewerbung für den Server",
                inline: false,
              },
              {
                name: "/ankündigung <nachricht>",
                value: "Sendet eine Ankündigung (nur für autorisierte Rollen)",
                inline: false,
              },
              {
                name: "/startup",
                value: "Sendet die Startnachricht manuell (nur Admins)",
                inline: false,
              },
            ],
            footer: { text: "GRP" },
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
          break;

        case "info":
          const portalUrl = process.env.REPL_SLUG
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : "Portal-URL nicht verfügbar";

          const infoEmbed = {
            color: 0x1976d2,
            title: "GRP",
            description: "Bot-Informationen und Details",
            fields: [
              {
                name: "📊 Status",
                value: "Online und einsatzbereit",
                inline: true,
              },
              { name: "⏱️ Laufzeit", value: this.getUptime(), inline: true },
              {
                name: "🌐 Web-Portal",
                value: `[Portal öffnen](${portalUrl})`,
                inline: false,
              },
              { name: "📝 Version", value: "23.5.1", inline: true },
              {
                name: "🎮 Aktivität",
                value: "Wechselt automatisch",
                inline: true,
              },
            ],
            footer: { text: "GRP" },
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
          break;

        case "bewerbung":
          const modal = new ModalBuilder()
            .setCustomId("bewerbung-modal")
            .setTitle("Bewerbung für Emergency Hamburg RP");

          const categoryRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("category")
                .setLabel("Bewerbungstyp")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Admin-Bewerbung oder Member-Bewerbung")
                .setRequired(true),
            );

          const contentRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("content")
                .setLabel("Bewerbungstext")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Schreiben Sie hier Ihre Bewerbung...")
                .setRequired(true)
                .setMinLength(50)
                .setMaxLength(2000),
            );

          modal.addComponents(categoryRow, contentRow);
          await interaction.showModal(modal);
          break;

        case "ankündigung":
          const authorizedRoles = [
            "1427009009524805683",
            "1389295000487203006",
            "1427013248737218600",
            "1389295000499654717",
          ];

          const member = interaction.member;
          const hasPermission = member.roles.cache.some((role: any) =>
            authorizedRoles.includes(role.id),
          );

          if (!hasPermission) {
            await interaction.reply({
              content:
                "❌ Du hast keine Berechtigung, diesen Befehl zu verwenden.",
              ephemeral: true,
            });
            return;
          }

          const message = interaction.options.getString("nachricht");
          const announcementEmbed = {
            color: 0xd32f2f,
            title: "📢 Ankündigung",
            description: message,
            footer: { text: `Von ${interaction.user.tag}` },
            timestamp: new Date().toISOString(),
          };

          await interaction.channel.send({ embeds: [announcementEmbed] });
          await interaction.reply({
            content: "✅ Ankündigung wurde erfolgreich gesendet.",
            ephemeral: true,
          });
          break;

        case "startup":
          const isAdmin = interaction.member.roles.cache.some((role: any) =>
            authorizedRoles.includes(role.id),
          );

          if (!isAdmin) {
            await interaction.reply({
              content:
                "❌ Du hast keine Berechtigung, diesen Befehl zu verwenden.",
              ephemeral: true,
            });
            return;
          }

          await this.sendStartupMessage();
          await interaction.reply({
            content: "✅ Startnachricht wurde gesendet.",
            ephemeral: true,
          });
          break;
      }
    } catch (error) {
      console.error("❌ Fehler beim Bearbeiten des Commands:", error);
      try {
        await interaction.reply({
          content: "❌ Ein Fehler ist aufgetreten.",
          ephemeral: true,
        });
      } catch (e) {
        console.error("❌ Konnte Fehler nicht senden:", e);
      }
    }
  }

  private async handleModalSubmit(interaction: any) {
    if (interaction.customId === "bewerbung-modal") {
      try {
        const category = interaction.fields.getTextInputValue("category");
        const content = interaction.fields.getTextInputValue("content");

        if (
          category !== "Admin-Bewerbung" &&
          category !== "Content Creator-Bewerbung"
        ) {
          await interaction.reply({
            content:
              '❌ Ungültige Kategorie. Bitte wählen Sie "Admin-Bewerbung" oder "Content Creator-Bewerbung".',
            ephemeral: true,
          });
          return;
        }

        const application = await storage.createApplication({
          discordName: interaction.user.tag,
          discordId: interaction.user.id,
          category,
          content,
          status: "Neu",
        });

        const confirmEmbed = {
          color: 0x4caf50,
          title: "✅ Bewerbung eingereicht",
          description:
            "Deine Bewerbung wurde erfolgreich eingereicht und wird bald bearbeitet.",
          fields: [
            { name: "Kategorie", value: category, inline: true },
            { name: "Status", value: "Neu", inline: true },
          ],
          footer: { text: "Vielen Dank für deine Bewerbung!" },
          timestamp: new Date().toISOString(),
        };

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
      } catch (error) {
        console.error("❌ Fehler beim Speichern der Bewerbung:", error);
        await interaction.reply({
          content:
            "❌ Fehler beim Speichern der Bewerbung. Bitte versuche es später erneut.",
          ephemeral: true,
        });
      }
    }
  }

  private async sendStartupMessage() {
    try {
      const guilds = this.client?.guilds.cache;

      guilds?.forEach(async (guild) => {
        const channel = guild.channels.cache.find(
          (ch: any) =>
            ch.type === 0 &&
            ch
              .permissionsFor(guild.members.me!)
              ?.has(PermissionFlagsBits.SendMessages),
        );

        if (channel) {
          const startEmbed = {
            color: 0x4caf50,
            title: "GRP Bot ist online!",
            description:
              "Der Bot und das Web-Portal sind jetzt aktiv und einsatzbereit.",
            fields: [
              { name: "🤖 Bot-Status", value: "Online", inline: true },
              {
                name: "🎮 Aktivität",
                value: "Wechselt automatisch",
                inline: true,
              },
              {
                name: "📋 Befehle",
                value: "Nutze `/hilfe` um alle Befehle zu sehen",
                inline: false,
              },
            ],
            footer: { text: "GRP" },
            timestamp: new Date().toISOString(),
          };

          await (channel as any).send({ embeds: [startEmbed] });
        }
      });
    } catch (error) {
      console.error("❌ Fehler beim Senden der Startnachricht:", error);
    }
  }

  getUptime(): string {
    const seconds = Math.floor((Date.now() - this.startTime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getStatus() {
    return {
      online: this.ready,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: "1.0.0",
      serverCount: this.client?.guilds.cache.size || 0,
      status: "Wechselt automatisch",
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

  async sendMessage(channelId: string, content: string) {
    if (!this.client) throw new Error("Bot ist nicht initialisiert");

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !("send" in channel)) {
      throw new Error(
        "Kanal nicht gefunden oder kann keine Nachrichten empfangen",
      );
    }

    await (channel as any).send(content);
  }

  isReady(): boolean {
    return this.ready;
  }
}

export const discordBot = new DiscordBot();
