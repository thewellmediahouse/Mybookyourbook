export function verifyEmailPageCopy(input: {
  mailReady: boolean;
  email: string | null;
}): { title: string; description: string } {
  if (!input.mailReady) {
    return {
      title: "Confirm your email",
      description:
        "Your account was created. Email sending is not connected yet, so we cannot send a confirmation message. You will not receive anything in your inbox until that is set up.",
    };
  }
  if (input.email) {
    return {
      title: "Thank you",
      description: `We've sent a message to ${input.email}. Open that inbox and tap the button to confirm this is your address. You cannot sign in until you do.`,
    };
  }
  return {
    title: "Thank you",
    description:
      "We've sent a message to the email you used. Open that inbox and tap the button to confirm this is your address. You cannot sign in until you do.",
  };
}

export function verifyEmailHref(email: string, next?: string | null): string {
  const params = new URLSearchParams();
  const trimmed = email.trim();
  if (trimmed) {
    params.set("email", trimmed);
  }
  if (next) {
    params.set("next", next);
  }
  const query = params.toString();
  return query ? `/verify-email?${query}` : "/verify-email";
}
