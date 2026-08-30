/** Locked light-theme pairs (sales light, 4.5:1). Emails stay light even in dark inboxes. */
export const EMAIL_PAGE = "#F7F8FC";
export const EMAIL_CARD = "#FFFFFF";
export const EMAIL_INK = "#111A31";
export const EMAIL_MUTED = "#5A6480";
export const EMAIL_LINK = "#0B5BD6";
export const EMAIL_BUTTON = "#1678FF";
export const EMAIL_BUTTON_LABEL = "#001038";
export const EMAIL_LOGO_PATH = "/brand/logo-stacked.png";

export function emailLogoUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}${EMAIL_LOGO_PATH}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderEmailHtml(input: {
  appUrl: string;
  heading: string;
  body: string;
  actionUrl: string;
  button: string;
}): string {
  const logo = escapeHtml(emailLogoUrl(input.appUrl));
  const heading = escapeHtml(input.heading);
  const body = escapeHtml(input.body);
  const actionUrl = escapeHtml(input.actionUrl);
  const button = escapeHtml(input.button);
  const home = escapeHtml(input.appUrl.replace(/\/$/, ""));

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${heading}</title>
  <style>
    :root { color-scheme: light only; }
    body, table, td { color-scheme: light only; }
  </style>
</head>
<body style="margin:0;padding:0;background:${EMAIL_PAGE};color:${EMAIL_INK};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${body}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${EMAIL_PAGE}" style="background:${EMAIL_PAGE};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="left" style="padding:0 8px 20px;">
              <a href="${home}" style="text-decoration:none;">
                <img src="${logo}" width="160" height="78" alt="Production30" style="display:block;border:0;width:160px;height:auto;max-width:160px;">
              </a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${EMAIL_CARD}" style="background:${EMAIL_CARD};border:1px solid #E6EAF2;border-radius:16px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="${EMAIL_BUTTON}" style="background:${EMAIL_BUTTON};height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 28px;">
                    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:650;color:${EMAIL_INK};">${heading}</h1>
                    <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${EMAIL_MUTED};">${body}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td bgcolor="${EMAIL_BUTTON}" style="background:${EMAIL_BUTTON};border-radius:8px;">
                          <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:650;color:${EMAIL_BUTTON_LABEL};text-decoration:none;">${button}</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:${EMAIL_MUTED};">
                      If the button does not work, open this link:<br>
                      <a href="${actionUrl}" style="color:${EMAIL_LINK};word-break:break-all;">${actionUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;font-size:13px;line-height:1.5;color:${EMAIL_MUTED};">
              Production30 · Your business, starring you.<br>
              This is a studio email from Production30.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
