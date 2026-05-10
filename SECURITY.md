# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public GitHub issue. Instead, email the project maintainers with:

- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Any suggested fixes

We take security seriously and will respond promptly.

## Supported Versions

| Version | Supported |
| --- | --- |
| latest | ✓ |
| older releases | Case-by-case basis |

## Security Best Practices

When running this bot:

1. **Keep dependencies updated:** Run `npm update` regularly and review changelogs for security fixes.
2. **Protect your `.env` file:** Never commit `.env` to version control. Use `.gitignore` to exclude it.
3. **Use strong tokens:** Regenerate your Discord bot token if you suspect compromise.
4. **Limit permissions:** Only grant the bot the Discord permissions it actually needs.
5. **Audit logs:** Monitor your bot's actions and Discord audit logs for unusual activity.

## Dependency Scanning

This project uses GitHub's dependency scanning and automated security checks. See the [Security](https://github.com/your-org/Minecraft-Discord-Bot/security) tab in the repository for details.

## Contact

For security concerns, reach out to the maintainers privately. Public disclosures will be handled responsibly.
