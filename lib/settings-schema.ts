import type { SettingKey } from "./runtime-config";

export type FieldDef = {
  key: SettingKey;
  label: string;
  secret?: boolean;
  multiline?: boolean;
  placeholder?: string;
  help?: string;
  link?: { href: string; text: string };
};

export type SettingsGroup = { title: string; intro?: string; fields: FieldDef[] };

/** Everything that can be set from Admin → Settings. */
export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Website",
    fields: [
      {
        key: "SITE_URL",
        label: "Public website address",
        placeholder: "https://catalog.luxiko.be",
        help: "The address people use (your reverse proxy's domain). QR codes, share links, e-mails and Google sign-in use it. Regenerate the PDF after changing it.",
      },
      {
        key: "MAIN_SITE_URL",
        label: "Main website address",
        placeholder: "https://luxiko.be",
        help: "The contact form on this website (with or without www.) may send messages through the catalog. They arrive like quote requests.",
      },
    ],
  },
  {
    title: "E-mail (Resend)",
    intro: "Quote requests are e-mailed through Resend. Without these they are still saved on the Quotes page.",
    fields: [
      {
        key: "RESEND_API_KEY",
        label: "Resend API key",
        secret: true,
        placeholder: "re_…",
        link: { href: "https://resend.com/api-keys", text: "Create an API key (Sending access)" },
      },
      {
        key: "MAIL_FROM",
        label: "Sender",
        placeholder: "LUXIKO <offerte@luxiko.be>",
        help: "The domain must be verified in Resend.",
        link: { href: "https://resend.com/domains", text: "Verify your domain in Resend" },
      },
      {
        key: "QUOTE_TO_EMAIL",
        label: "Send quote requests to",
        placeholder: "info@luxiko.be",
        help: "Comma separated for several people.",
      },
    ],
  },
  {
    title: "Google sign-in (optional)",
    intro: "Lets people sign in to the admin with a Google account instead of the password.",
    fields: [
      {
        key: "GOOGLE_CLIENT_ID",
        label: "Google OAuth client ID",
        placeholder: "…apps.googleusercontent.com",
        link: { href: "https://console.cloud.google.com/apis/credentials", text: "Google Cloud → Credentials → Create OAuth client ID (Web application)" },
      },
      {
        key: "GOOGLE_CLIENT_SECRET",
        label: "Google OAuth client secret",
        secret: true,
        link: { href: "https://console.cloud.google.com/apis/credentials/consent", text: "Also fill in the OAuth consent screen" },
      },
      {
        key: "ADMIN_EMAILS",
        label: "Google accounts allowed in the admin",
        placeholder: "you@gmail.com, colleague@luxiko.be",
        help: "Comma separated. Only these Google accounts can sign in.",
      },
    ],
  },
  {
    title: "Company details",
    intro: "Shown in the website footer, in e-mails and on the back of the PDF.",
    fields: [
      { key: "COMPANY_NAME", label: "Company name", placeholder: "LUXIKO" },
      { key: "COMPANY_EMAIL", label: "E-mail", placeholder: "info@luxiko.be" },
      { key: "COMPANY_PHONE", label: "Phone", placeholder: "+32 …" },
      { key: "COMPANY_ADDRESS", label: "Address", multiline: true },
      { key: "COMPANY_VAT", label: "VAT number", placeholder: "BE0…" },
    ],
  },
];

export const EDITABLE_KEYS = SETTINGS_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
