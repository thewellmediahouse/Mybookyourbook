import type { DesignBrief } from '@/types/designStudio';

/**
 * Per-step wizard validation shared by the client wizard (and later APIs).
 */
export function validateWizardStep(
  step: number,
  brief: Partial<DesignBrief>,
): string | null {
  switch (step) {
    case 1:
      if (!brief.businessName?.trim()) return 'Please enter your business name.';
      if (!brief.industry) return 'Please select an industry.';
      if (brief.industry === 'Other' && !brief.customIndustry?.trim()) {
        return 'Please describe your industry.';
      }
      if (!brief.businessDescription || brief.businessDescription.trim().length < 20) {
        return 'Please add a short business description (at least 20 characters).';
      }
      return null;
    case 2:
      if (!brief.goals?.length) return 'Select at least one primary goal.';
      return null;
    case 3:
      if (!brief.websiteType) return 'Select a website type.';
      return null;
    case 4:
      if (!brief.primaryStyle) return 'Select a primary visual style.';
      return null;
    case 5:
      if (!brief.colourMode) return 'Select a colour direction.';
      if (brief.colourMode === 'Custom colours' && !(brief.customColours?.length)) {
        return 'Add 1–4 custom colour values.';
      }
      return null;
    case 6:
      if (!brief.features?.length) return 'Select at least one feature.';
      return null;
    case 7:
      if (!brief.pages?.length && !(brief.customPages?.length)) {
        return 'Select or add at least one page.';
      }
      return null;
    case 8:
      return null;
    case 9:
      if (!brief.freeTextBrief || brief.freeTextBrief.trim().length < 30) {
        return 'Please describe your dream website (at least 30 characters).';
      }
      return null;
    case 10:
      if (!brief.acceptedTerms) {
        return 'Please confirm you agree to the Terms and Privacy notes.';
      }
      return null;
    default:
      return null;
  }
}
