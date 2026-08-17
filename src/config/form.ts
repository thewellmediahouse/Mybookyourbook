import { companyConfig } from '@/config/company';
import { servicesConfig } from '@/config/services';
import { getAlaCarteInterestOptions, getPackageInterestOptions, packagesConfig } from '@/config/packages';

/**
 * Contact form — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 *
 * FormSubmit setup (default):
 * 1. Set `endpoint` to the recipient email (defaults to company email).
 * 2. Optionally override with PUBLIC_FORMSUBMIT_EMAIL in `.env`.
 * 3. Submit the form once on the live site and confirm via FormSubmit's activation email.
 */
export type FormProvider = 'formsubmit' | 'formspree' | 'web3forms' | 'custom';

export type FormFieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'date';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  halfWidth?: boolean;
}

export interface FormConfig {
  provider: FormProvider;
  /** Provider-specific value: FormSubmit/Formspree email or ID, Web3Forms access key, or custom URL. */
  endpoint: string;
  subject?: string;
  title: string;
  fields: FormField[];
  successMessage: string;
  errorMessage: string;
}

const defaultFormSubmitEmail =
  import.meta.env.PUBLIC_FORMSUBMIT_EMAIL ?? companyConfig.email;

/** Normalize a FormSubmit endpoint to a bare email address. */
export function resolveFormSubmitEmail(endpoint: string): string {
  const trimmed = endpoint.trim();

  if (trimmed.startsWith('http')) {
    try {
      const { pathname } = new URL(trimmed);
      const email = pathname.replace(/^\/ajax\/?/i, '').replace(/^\//, '');
      if (email.includes('@')) {
        return decodeURIComponent(email);
      }
    } catch {
      // Fall through to return trimmed value.
    }
  }

  return trimmed.replace(/^mailto:/i, '');
}

/** Resolve the form `action` URL from provider config. */
export function resolveFormAction(config: Pick<FormConfig, 'provider' | 'endpoint'>): string {
  switch (config.provider) {
    case 'formsubmit': {
      const email = resolveFormSubmitEmail(config.endpoint);
      return `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
    }
    case 'formspree':
      return config.endpoint.startsWith('http')
        ? config.endpoint
        : `https://formspree.io/f/${config.endpoint}`;
    case 'web3forms':
      return 'https://api.web3forms.com/submit';
    case 'custom':
      return config.endpoint;
    default:
      return config.endpoint;
  }
}

function serviceSelectOptions(): FormFieldOption[] {
  return [
    ...servicesConfig.map((s) => ({ value: s.slug, label: s.name })),
    { value: 'not-sure', label: 'Not Sure Yet' },
  ];
}

const consultationTimeOptions: FormFieldOption[] = [
  '09:00 AM',
  '11:00 AM',
  '01:00 PM',
  '03:00 PM',
  '05:00 PM',
].map((time) => ({ value: time, label: time }));

export const formConfig: FormConfig = {
  provider: 'formsubmit',
  endpoint: defaultFormSubmitEmail,
  subject: 'New enquiry from The Well Media website',
  title: 'Send Us a Message',
  successMessage:
    'Thank you. We have received your message and will contact you shortly.',
  errorMessage:
    'Something went wrong. Please try again or contact us directly on WhatsApp.',
  fields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      halfWidth: true,
    },
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'text',
      halfWidth: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      halfWidth: true,
    },
    {
      name: 'phone',
      label: 'Phone / WhatsApp',
      type: 'tel',
      halfWidth: true,
    },
    {
      name: 'serviceNeeded',
      label: 'Service Needed',
      type: 'select',
      options: serviceSelectOptions(),
    },
    ...(packagesConfig.servicePackages.length > 0 || packagesConfig.bundles.length > 0
      ? [
          {
            name: 'packageInterest',
            label: 'Package Interest',
            type: 'select' as const,
            options: getPackageInterestOptions(),
          },
        ]
      : []),
    ...(packagesConfig.alaCarte.length > 0
      ? [
          {
            name: 'alaCarteInterest',
            label: 'Individual Item Interest',
            type: 'select' as const,
            options: getAlaCarteInterestOptions(),
          },
        ]
      : []),
    {
      name: 'consultationDate',
      label: 'Preferred Consultation Date',
      type: 'date',
    },
    {
      name: 'consultationTime',
      label: 'Preferred Consultation Time',
      type: 'select',
      options: consultationTimeOptions,
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Tell us about your business, goals, and where you want to grow.',
    },
  ],
};

export const pricingFormConfig: FormConfig = {
  provider: formConfig.provider,
  endpoint: formConfig.endpoint,
  subject: 'New packages enquiry from The Well Media website',
  title: 'Get in touch',
  successMessage: formConfig.successMessage,
  errorMessage: formConfig.errorMessage,
  fields: [
    {
      name: 'fullName',
      label: 'Your Name',
      type: 'text',
      required: true,
      halfWidth: true,
    },
    {
      name: 'businessName',
      label: 'Business Name',
      type: 'text',
      halfWidth: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      halfWidth: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      halfWidth: true,
    },
    {
      name: 'serviceNeeded',
      label: 'What do you need?',
      type: 'select',
      options: serviceSelectOptions(),
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: 'Tell us about your business and growth goals.',
    },
  ],
};

export type FormConfigType = typeof formConfig;
