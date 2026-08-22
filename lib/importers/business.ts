export type BusinessImportFields = {
  name?: string;
  website?: string;
  description?: string;
  tagline?: string;
  phone?: string;
  email?: string;
};

export type BusinessImportResult = {
  status: "needs_review" | "unavailable";
  sourceUrl: string;
  fields: BusinessImportFields;
  warnings: string[];
};

export interface BusinessImporter {
  import(url: string): Promise<BusinessImportResult>;
}

/** Does not fetch or invent business facts. Onboarding still requires the owner to type details. */
export function createUnavailableBusinessImporter(): BusinessImporter {
  return {
    async import(url: string) {
      return {
        status: "unavailable",
        sourceUrl: url.trim(),
        fields: {},
        warnings: [
          "Website import is not connected yet. Enter your business details yourself so nothing is invented.",
        ],
      };
    },
  };
}

export function getBusinessImporter(): BusinessImporter {
  return createUnavailableBusinessImporter();
}
