import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Working terms of use for Production30. Requires professional legal review before launch.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms are a working placeholder. They are not legal advice and are not
        attorney-reviewed. They must be replaced by counsel-reviewed terms before any public
        launch.
      </p>
      <p>
        By creating an account you agree that Production30 may store your profile, brand materials and
        production files in order to produce your commercial, and that you will only upload content
        you have the right to use.
      </p>
      <p>
        Production30 is for authorised business advertising. You must not use the service to impersonate
        someone without permission.
      </p>
    </LegalPage>
  );
}
