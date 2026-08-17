import { DESIGN_STUDIO_PROMPT_VERSION } from '@/ai/design-studio/promptVersion';
import type {
  DesignBrief,
  DesignUploadKind,
  StructuredDesignBrief,
  WebsiteScanBrief,
} from '@/types/designStudio';

function resolveIndustry(brief: DesignBrief): string {
  if (brief.industry === 'Other') {
    return brief.customIndustry?.trim() || 'Other';
  }
  return brief.industry;
}

function inferUploadEntries(brief: DesignBrief): StructuredDesignBrief['uploads'] {
  const remote = brief.uploadedFiles ?? [];
  if (remote.length) {
    return remote.map((file) => ({
      kind: (file.kind as DesignUploadKind) || 'other',
      available: true,
      count: 1,
      name: file.name,
    }));
  }

  const names = brief.uploadNames ?? [];
  if (!names.length) {
    return [{ kind: 'logo', available: false }];
  }

  return names.map((name) => {
    const lower = name.toLowerCase();
    let kind: DesignUploadKind | 'named_file' = 'named_file';
    if (lower.includes('logo')) kind = 'logo';
    else if (lower.endsWith('.pdf') || lower.includes('brand')) kind = 'brand_guide';
    else if (lower.includes('team')) kind = 'team_photo';
    else if (lower.includes('product')) kind = 'product_photo';
    else if (lower.includes('reference') || lower.includes('screenshot')) kind = 'reference';
    else kind = 'other';

    return {
      kind,
      available: true,
      count: 1,
      name,
    };
  });
}

/**
 * Normalize a wizard brief into the structured payload used by the strategist model.
 * Does not include Well Media House business identity.
 */
export function buildDesignBrief(
  brief: DesignBrief,
  websiteScan?: WebsiteScanBrief | null,
): StructuredDesignBrief {
  const pages = [...new Set([...(brief.pages ?? []), ...(brief.customPages ?? [])])];

  return {
    promptVersion: DESIGN_STUDIO_PROMPT_VERSION,
    business: {
      name: brief.businessName.trim(),
      industry: resolveIndustry(brief),
      description: brief.businessDescription.trim(),
      ...(brief.existingWebsiteUrl?.trim()
        ? { existingWebsiteUrl: brief.existingWebsiteUrl.trim() }
        : {}),
      ...(brief.market?.trim() ? { market: brief.market.trim() } : {}),
    },
    goals: brief.goals,
    websiteType: brief.websiteType,
    style: {
      primary: brief.primaryStyle,
      ...(brief.secondaryStyle?.trim()
        ? { secondary: brief.secondaryStyle.trim() }
        : {}),
    },
    colours: {
      mode: brief.colourMode,
      custom: brief.customColours ?? [],
    },
    features: brief.features,
    ...(brief.features.includes('Online shop') && brief.shopDetails
      ? { shopDetails: brief.shopDetails }
      : {}),
    pages,
    freeTextBrief: brief.freeTextBrief.trim(),
    ...(brief.avoid?.trim() ? { avoid: brief.avoid.trim() } : {}),
    uploads: inferUploadEntries(brief),
    ...(websiteScan ? { websiteScan } : {}),
  };
}
