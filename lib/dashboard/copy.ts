export const EMPTY_HEADING = "Your first commercial starts here.";
export const EMPTY_BODY =
  "Tell us about your business, show us who you are, and Production30 will direct and produce the rest.";
export const EMPTY_CTA = "Create My First Advert";
export const EMPTY_STEPS = ["Brief us", "Approve the concept", "Receive your commercial"] as const;
export const CREATE_UNAVAILABLE =
  "Creating a commercial is not open yet. You will brief us, approve the concept, then produce — that flow is coming next.";
export const VIEWER_CANNOT_CREATE =
  "Viewers can watch finished commercials but cannot produce a new one.";
export const BUY_CREDITS_UNAVAILABLE =
  "Buying credits opens when payment is connected. No charge can be made from here yet.";
export const BUY_CREDITS_OWNER_ONLY = "Only the studio owner can buy credits.";
export const CREATE_BUTTON = "+ Create Advert";
export const WELCOME_SUBHEADING = "What would you like to create today?";
export const COMMERCIALS_HEADING = "Your Commercials";

export function welcomeHeading(firstName: string): string {
  return `Welcome back, ${firstName}.`;
}

export function creditsAvailableLabel(balance: number): string {
  return `${balance} available`;
}
