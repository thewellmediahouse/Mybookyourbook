/**
 * FAQ — maps to NEW_WEBSITE_INPUT_SPEC "FAQ" section.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqConfig: FaqItem[] = [
  {
    question: 'How long does a typical project take?',
    answer:
      'Most website and brand projects launch in 4–8 weeks depending on scope, content readiness, and feedback cycles. We provide a detailed timeline during discovery.',
  },
  {
    question: 'Do you work with businesses outside your local area?',
    answer:
      'Yes. We collaborate remotely with clients across the United States and internationally using structured check-ins and shared project tools.',
  },
  {
    question: 'What is included in ongoing support?',
    answer:
      'Support plans cover content updates, performance monitoring, security patches, and minor design adjustments. Custom SLAs are available for larger teams.',
  },
  {
    question: 'Can you integrate with our existing tools?',
    answer:
      'We connect forms, analytics, CRM, and marketing platforms through standard integrations. Custom API work is available when needed.',
  },
];

export type FaqConfig = typeof faqConfig;
