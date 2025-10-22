import { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits, REST, Routes, ApplicationCommandOptionType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { storage } from './storage';

export class DiscordBot {
  private client: Client | null = null;
  private startTime: number = 0;
  private ready: boolean = false;

  async initialize() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;
      
      if (!token) {
        throw new Error('DISCORD_BOT_TOKEN ist nicht gesetzt');
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ]
      });

      this.startTime = Date.now();

      this.client.once('ready', async () => {
        console.log(`✅ Discord Bot eingeloggt als ${this.client?.user?.tag}`);
        this.ready = true;

        // Bot-Status setzen
        this.client?.user?.setPresence({
          activities: [{
            name: 'Hamburg Response Network (HRN)',
            type: ActivityType.Playing,
          }],
          status: 'online',
        });

        // Slash-Commands registrieren
        await this.registerCommands();

        // Startnachricht senden
        await this.sendStartupMessage();
      });

      // Slash-Command Handler
      this.client.on('interactionCreate', async (interaction) => {
        if (interaction.isChatInputCommand()) {
          await this.handleCommand(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.handleModalSubmit(interaction);
        }
      });

      await this.client.login(token);
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren des Discord-Bots:', error);
      throw error;
    }
  }

  private async registerCommands() {
    if (!this.client?.user || !this.client.application) return;

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return;
    
    const rest = new REST({ version: '10' }).setToken(token);

    const commands = [
      {
        name: 'ping',
        description: 'Prüft ob der Bot online ist',
      },
      {
        name: 'hilfe',
        description: 'Zeigt alle verfügbaren Befehle',
      },
      {
        name: 'info',
        description: 'Zeigt Bot-Informationen und Portal-Link',
      },
      {
        name: 'bewerbung',
        description: 'Startet eine Bewerbung für den Server',
      },
      {
        name: 'ankündigung',
        description: 'Sendet eine Ankündigung in den aktuellen Kanal (nur für autorisierte Rollen)',
        options: [
          {
            name: 'nachricht',
            type: ApplicationCommandOptionType.String,
            description: 'Die Nachricht die gesendet werden soll',
            required: true,
          },
        ],
      },
    ];

    try {
      await rest.put(
        Routes.applicationCommands(this.client.application.id),
        { body: commands }
      );
      console.log('✅ Slash-Commands erfolgreich registriert');
    } catch (error) {
      console.error('❌ Fehler beim Registrieren der Commands:', error);
    }
  }

  private async handleCommand(interaction: any) {
    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'ping':
          await interaction.reply({
            content: '🏓 Pong! Der Bot ist online und einsatzbereit.',
            ephemeral: true,
          });
          break;

        case 'hilfe':
          const helpEmbed = {
            color: 0xD32F2F,
            title: '📋 Emergency Assistant - Befehle',
            description: 'Hier ist eine Übersicht aller verfügbaren Befehle:',
            fields: [
              {
                name: '/ping',
                value: 'Prüft ob der Bot online ist',
                inline: false,
              },
              {
                name: '/hilfe',
                value: 'Zeigt diese Befehlsübersicht',
                inline: false,
              },
              {
                name: '/info',
                value: 'Zeigt Bot-Informationen und Portal-Link',
                inline: false,
              },
              {
                name: '/bewerbung',
                value: 'Startet eine Bewerbung für den Server',
                inline: false,
              },
              {
                name: '/ankündigung <nachricht>',
                value: 'Sendet eine Ankündigung (nur für autorisierte Rollen)',
                inline: false,
              },
            ],
            footer: {
              text: 'Emergency Hamburg RP Server',
            },
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
          break;

        case 'info':
          const portalUrl = process.env.REPL_SLUG 
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : 'Portal-URL nicht verfügbar';
          
          const infoEmbed = {
            color: 0x1976D2,
            title: '🤖 Emergency Assistant',
            description: 'Bot-Informationen und Details',
            fields: [
              {
                name: '📊 Status',
                value: 'Online und einsatzbereit',
                inline: true,
              },
              {
                name: '⏱️ Laufzeit',
                value: this.getUptime(),
                inline: true,
              },
              {
                name: '🌐 Web-Portal',
                value: `[Portal öffnen](${portalUrl})`,
                inline: false,
              },
              {
                name: '📝 Version',
                value: '1.0.0',
                inline: true,
              },
              {
                name: '🎮 Aktivität',
                value: 'Spielt Hamburg Response Network (HRN)',
                inline: true,
              },
            ],
            footer: {
              text: 'Emergency Hamburg RP Server',
            },
            timestamp: new Date().toISOString(),
          };
          await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
          break;

        case 'bewerbung':
          const modal = new ModalBuilder()
            .setCustomId('bewerbung-modal')
            .setTitle('Bewerbung für Emergency Hamburg RP');

          const categoryRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('category')
              .setLabel('Bewerbungstyp')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Admin-Bewerbung oder Member-Bewerbung')
              .setRequired(true)
          );

          const contentRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('content')
              .setLabel('Bewerbungstext')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Schreiben Sie hier Ihre Bewerbung...')
              .setRequired(true)
              .setMinLength(50)
              .setMaxLength(2000)
          );

          modal.addComponents(categoryRow, contentRow);
          await interaction.showModal(modal);
          break;

        case 'ankündigung':
          // Autorisierte Rollen-IDs
          const authorizedRoles = [
            '1427009009524805683',
            '1389295000487203006',
            '1427013248737218600',
            '1389295000499654717',
          ];

          const member = interaction.member;
          const hasPermission = member.roles.cache.some((role: any) => 
            authorizedRoles.includes(role.id)
          );

          if (!hasPermission) {
            await interaction.reply({
              content: '❌ Du hast keine Berechtigung, diesen Befehl zu verwenden.',
              ephemeral: true,
            });
            return;
          }

          const message = interaction.options.getString('nachricht');
          const announcementEmbed = {
            color: 0xD32F2F,
            title: '📢 Ankündigung',
            description: message,
            footer: {
              text: `Von ${interaction.user.tag}`,
            },
            timestamp: new Date().toISOString(),
          };

          await interaction.channel.send({ embeds: [announcementEmbed] });
          await interaction.reply({
            content: '✅ Ankündigung wurde erfolgreich gesendet.',
            ephemeral: true,
          });
          break;
      }
    } catch (error) {
      console.error('❌ Fehler beim Bearbeiten des Commands:', error);
      try {
        await interaction.reply({
          content: '❌ Ein Fehler ist aufgetreten.',
          ephemeral: true,
        });
      } catch (e) {
        console.error('❌ Konnte Fehler nicht senden:', e);
      }
    }
  }

  private async handleModalSubmit(interaction: any) {
    if (interaction.customId === 'bewerbung-modal') {
      try {
        const category = interaction.fields.getTextInputValue('category');
        const content = interaction.fields.getTextInputValue('content');

        // Validierung der Kategorie
        if (category !== 'Admin-Bewerbung' && category !== 'Member-Bewerbung') {
          await interaction.reply({
            content: '❌ Ungültige Kategorie. Bitte wählen Sie "Admin-Bewerbung" oder "Member-Bewerbung".',
            ephemeral: true,
          });
          return;
        }

        // Bewerbung speichern
        const application = await storage.createApplication({
          discordName: interaction.user.tag,
          discordId: interaction.user.id,
          category,
          content,
          status: 'Neu',
        });

        const confirmEmbed = {
          color: 0x4CAF50,
          title: '✅ Bewerbung eingereicht',
          description: 'Deine Bewerbung wurde erfolgreich eingereicht und wird bald bearbeitet.',
          fields: [
            {
              name: 'Kategorie',
              value: category,
              inline: true,
            },
            {
              name: 'Status',
              value: 'Neu',
              inline: true,
            },
          ],
          footer: {
            text: 'Vielen Dank für dein Interesse!',
          },
          timestamp: new Date().toISOString(),
        };

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
      } catch (error) {
        console.error('❌ Fehler beim Speichern der Bewerbung:', error);
        await interaction.reply({
          content: '❌ Fehler beim Speichern der Bewerbung. Bitte versuche es später erneut.',
          ephemeral: true,
        });
      }
    }
  }

  private async sendStartupMessage() {
    try {
      // Sende Startnachricht an den ersten Textkanal jedes Servers
      const guilds = this.client?.guilds.cache;
      
      guilds?.forEach(async (guild) => {
        const channel = guild.channels.cache.find(
          (ch: any) => ch.type === 0 && ch.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
        );

        if (channel) {
          const startEmbed = {
            color: 0x4CAF50,
            title: '✅ Emergency Assistant ist online!',
            description: 'Der Bot und das Web-Portal sind jetzt aktiv und einsatzbereit.',
            fields: [
              {
                name: '🤖 Bot-Status',
                value: 'Online',
                inline: true,
              },
              {
                name: '🎮 Aktivität',
                value: 'Spielt Hamburg Response Network (HRN)',
                inline: true,
              },
              {
                name: '📋 Befehle',
                value: 'Nutze `/hilfe` um alle Befehle zu sehen',
                inline: false,
              },
            ],
            footer: {
              text: 'Emergency Hamburg RP Server',
            },
            timestamp: new Date().toISOString(),
          };

          await (channel as any).send({ embeds: [startEmbed] });
        }
      });
    } catch (error) {
      console.error('❌ Fehler beim Senden der Startnachricht:', error);
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
      version: '1.0.0',
      serverCount: this.client?.guilds.cache.size || 0,
      status: 'Spielt Hamburg Response Network (HRN)',
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
    if (!this.client) throw new Error('Bot ist nicht initialisiert');

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !('send' in channel)) {
      throw new Error('Kanal nicht gefunden oder kann keine Nachrichten empfangen');
    }

    await (channel as any).send(content);
  }

  isReady(): boolean {
    return this.ready;
  }
}

export const discordBot = new DiscordBot();
