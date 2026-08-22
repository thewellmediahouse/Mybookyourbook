import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Working privacy notice for Production30. Requires professional legal review before launch.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This privacy notice is a working placeholder. It is not a complete privacy policy, is not
        attorney-reviewed, and requires professional legal review before launch.
      </p>
      <p>
        Production30 stores account details, session data, brand assets and production files needed to
        create your commercial. Email is used for verification, password reset and production
        notices.
      </p>
      <p>
        Footage and brand files may be processed through our video production partner, footage
        enhancement partner, cloud hosting and storage, payment provider, and email provider in
        order to produce and deliver your commercial. Do not treat this page as a live processing
        statement until counsel has reviewed it.
      </p>
    </LegalPage>
  );
}
