export type DesignStudioContactInput = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  preferredTiming?: string;
  note?: string;
};

export type DesignStudioContact = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  preferredTiming: string | null;
  note: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trim(value: unknown, max: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

/**
 * Validate contact capture fields for Design Studio checkout.
 */
export function validateContactInput(
  raw: Partial<DesignStudioContactInput> | null | undefined,
): { ok: true; value: DesignStudioContact } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const fullName = trim(raw?.fullName, 120);
  const email = trim(raw?.email, 180).toLowerCase();
  const phone = trim(raw?.phone, 40);
  const businessName = trim(raw?.businessName, 160);
  const preferredTiming = trim(raw?.preferredTiming, 80) || null;
  const note = trim(raw?.note, 2000) || null;

  if (fullName.length < 2) errors.push('Full name is required.');
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email address is required.');

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) errors.push('Phone / WhatsApp number is required.');

  if (businessName.length < 2) errors.push('Business name is required.');

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      fullName,
      email,
      phone,
      businessName,
      preferredTiming,
      note,
    },
  };
}
