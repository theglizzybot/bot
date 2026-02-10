import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          "status": "Status",
          "uptime": "Uptime",
          "version": "Version",
          "servers": "Servers",
          "bot_info": "Bot Information",
          "apply": "Apply",
          "admin_apply": "Admin Application",
          "member_apply": "Member Application",
          "send_message": "Send Message",
          "help": "Help",
          "online": "Online",
          "offline": "Offline",
        }
      },
      de: {
        translation: {
          "status": "Status",
          "uptime": "Laufzeit",
          "version": "Version",
          "servers": "Server",
          "bot_info": "Bot-Informationen",
          "apply": "Bewerben",
          "admin_apply": "Admin-Bewerbung",
          "member_apply": "Member-Bewerbung",
          "send_message": "Nachricht senden",
          "help": "Hilfe",
          "online": "Online",
          "offline": "Offline",
        }
      }
    }
  });

export default i18n;
