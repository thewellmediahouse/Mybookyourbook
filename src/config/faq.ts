/**
 * FAQ — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqConfig: FaqItem[] = [
  {
    question: 'How quickly do you respond?',
    answer: 'We typically respond within 24 hours during business days.',
  },
  {
    question: 'Are consultations free?',
    answer: 'Yes. The initial consultation is free and obligation-free.',
  },
  {
    question: 'Can you help small businesses?',
    answer: 'Yes. We work with startups, growing brands, and established businesses.',
  },
  {
    question: 'Do we need to launch everything at once?',
    answer:
      'No. We can phase the project in stages and start with the highest-impact priorities first.',
  },
  {
    question: 'Are you only a social media company?',
    answer:
      'No. The Well Media is a Business Growth Partner. We help with strategy, systems, content, websites, media production, events, and growth consulting.',
  },
  {
    question: 'Can clients choose what they need?',
    answer:
      'Yes. Clients can explore Content Creation, Content Management, Business Growth, and Starter / Launch Pack options, then book a consultation for guidance.',
  },
  {
    question: 'What is the best first step?',
    answer:
      'The best first step is to book a consultation so we can understand the business, goals, budget, and growth priorities.',
  },
];

export type FaqConfig = typeof faqConfig;
