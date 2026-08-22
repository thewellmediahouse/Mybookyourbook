import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Acceptable use",
  description:
    "Production30 is for authorised business advertising. Requires professional legal review before launch.",
};

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable use">
      <p>
        This acceptable-use notice is a working placeholder. It is not attorney-reviewed and
        requires professional legal review before launch.
      </p>
      <p>Production30 is for authorised business advertising.</p>
      <p>You must have the right to use the face, voice, logo and copy you provide.</p>
      <p>
        Do not use Production30 for celebrity impersonation, a public cloning library, anonymous
        third-party impersonation, or a public searchable face gallery.
      </p>
      <p>
        We may suspend accounts that break these rules. You can report abuse from inside your
        studio once support tools are available.
      </p>
    </LegalPage>
  );
}
