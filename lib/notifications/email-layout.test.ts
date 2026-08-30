import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMAIL_BUTTON,
  EMAIL_BUTTON_LABEL,
  EMAIL_CARD,
  EMAIL_INK,
  EMAIL_LOGO_PATH,
  EMAIL_PAGE,
  emailLogoUrl,
} from "./email-layout";
import { renderEmail } from "./templates";
import type { EmailTemplateId } from "./messages";

const TEMPLATES: EmailTemplateId[] = [
  "welcome",
  "verify-email",
  "existing-account",
  "reset-password",
  "commercial-ready",
  "commercial-failed",
  "payment-receipt",
  "team-invite",
  "support-staff",
  "support-received",
  "support-reply",
];

test("every outgoing email is a light layout with the Production30 logo", () => {
  for (const template of TEMPLATES) {
    const rendered = renderEmail({
      kind: "email",
      template,
      to: "owner@cineyou.test",
      idempotencyKey: `${template}/layout`,
      appUrl: "https://cineyou.test",
      actionUrl: "/dashboard",
      firstName: "Pat",
    });
    assert.match(rendered.html, /color-scheme:\s*light only/);
    assert.match(rendered.html, /supported-color-schemes" content="light"/);
    assert.ok(rendered.html.includes(`background:${EMAIL_PAGE}`));
    assert.ok(rendered.html.includes(`background:${EMAIL_CARD}`));
    assert.ok(rendered.html.includes(`color:${EMAIL_INK}`));
    assert.ok(rendered.html.includes(`color:${EMAIL_BUTTON_LABEL}`));
    assert.ok(rendered.html.includes(`background:${EMAIL_BUTTON}`));
    assert.match(rendered.html, new RegExp(EMAIL_LOGO_PATH.replace("/", "\\/")));
    assert.match(rendered.html, /alt="Production30"/);
    assert.doesNotMatch(rendered.html, /#05070F|#0C1224|#1A2033|#F4F6FB|#9AA3B8/);
    assert.doesNotMatch(rendered.html, /color:#FFFFFF/);
  }
});

test("email logo uses the hosted stacked mark on the app origin", () => {
  assert.equal(emailLogoUrl("https://production30.thewellmedia.com/"), "https://production30.thewellmedia.com/brand/logo-stacked.png");
});
