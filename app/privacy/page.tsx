import type { Metadata } from "next";
import Link from "next/link";
import { LegalH2, LegalH3, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Working privacy notice for Production30. Requires professional legal review before launch.",
};

const UPDATED = "25 August 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated={UPDATED}>
      <p>
        This notice explains how Production30 (“we”, “us”) handles information when you visit the
        public site, create a studio, or contact us. It should be read with the{" "}
        <Link href="/terms" className="text-foreground underline">
          Terms of use
        </Link>
        . Production30 makes 30-second business commercials starring you. That means we hold more
        than a name and email: we hold photos, a short reference video, brand files, and the
        finished commercial.
      </p>
      <p>
        You can look at the marketing pages without an account. If you do not agree with this
        notice, do not create an account and do not send us identity media.
      </p>

      <LegalH2>1. Who we are</LegalH2>
      <p>
        Production30 is the service at production30.com and related studio URLs. Privacy questions:
        {" "}
        <Link href="/contact" className="text-foreground underline">
          Contact us
        </Link>
        , Help after you sign in, or Accounts@production30.com.
      </p>

      <LegalH2>2. Information we collect</LegalH2>
      <LegalH3>Account and studio</LegalH3>
      <ul className="list-disc space-y-2 pl-5">
        <li>Name, email, password (stored as a hash), and session data.</li>
        <li>Studio name, membership, roles, and invitations you send.</li>
        <li>Business profile details you enter (for example name, website, offer, location).</li>
        <li>
          Sign-in through Google if you choose it: we receive the email and profile fields Google
          shares with your permission.
        </li>
      </ul>
      <LegalH3>Identity and production</LegalH3>
      <ul className="list-disc space-y-2 pl-5">
        <li>Reference photos of the presenter (typically front and sides).</li>
        <li>A short reference video of the presenter speaking.</li>
        <li>The consent you tick before those files are used.</li>
        <li>Brand files such as a logo.</li>
        <li>Campaign brief, Commercial Concept, and production status.</li>
        <li>Finished commercials and working files needed to produce them.</li>
      </ul>
      <LegalH3>Billing and messages</LegalH3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Plan, Ad Credit balance, and payment records (amount, currency, status, provider
          reference). Full card numbers are handled by the payment provider, not stored in the
          studio.
        </li>
        <li>Help tickets, Contact us messages, and our replies.</li>
      </ul>
      <LegalH3>Technical data</LegalH3>
      <p>
        We collect the usual website logs needed to run and protect the Service: IP address,
        approximate location from IP, browser and device type, pages viewed, and error information.
        We use cookies or similar storage for sign-in and basic preferences. The Service does not
        change behaviour because of a browser “Do Not Track” signal.
      </p>

      <LegalH2>3. Why we use it</LegalH2>
      <p>We use this information to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>create and secure your account and studio;</li>
        <li>produce a commercial that stars the consented presenter;</li>
        <li>apply your brand details accurately;</li>
        <li>take payment, add Ad Credits after confirmation, and keep billing records;</li>
        <li>
          send mail you need for the Service: verify email, reset password, production notices,
          support replies;
        </li>
        <li>answer Help and Contact us, including Refund, Cancel plan, and Abuse;</li>
        <li>detect abuse, fraud, and security incidents;</li>
        <li>meet tax, accounting, and other legal duties;</li>
        <li>improve the studio from aggregated use, not from selling your face.</li>
      </ul>
      <p>
        We do not operate a public face search. We do not sell identity media as a stock library.
        Marketing example videos on the public site are style references, not your files.
      </p>

      <LegalH2>4. Who processes your media</LegalH2>
      <p>
        To produce and deliver a commercial, footage and brand files may be processed through:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>a video production partner (filming your commercial from the approved concept);</li>
        <li>a footage finishing partner;</li>
        <li>a finishing step that adds your brand details;</li>
        <li>cloud hosting and private storage;</li>
        <li>a payment provider;</li>
        <li>an email provider.</li>
      </ul>
      <p>
        Those partners receive only what they need for that step. Identity and production files are
        stored privately. The studio keeps object keys, not public permanent links. When you play or
        download a file, we issue a short-lived signed address.
      </p>
      <p>
        We may also disclose information if the law requires it, to protect a person from serious
        harm, or to a buyer if the Service is transferred — in which case this notice would still
        apply until it is replaced.
      </p>

      <LegalH2>5. Identity media</LegalH2>
      <p>
        Photos and a reference video of a real person are sensitive. We use them only to produce
        authorised advertising for the studio that uploaded them, and only after the consent
        recorded in the studio: that you are the person shown and heard, or that you have that
        person’s permission, and that you will not impersonate someone without authorisation.
      </p>
      <p>
        Teammates in your studio can see what the studio role allows. Staff who operate Production30
        can access a workspace when needed for support, safety, or running production — not to
        publish a public gallery.
      </p>

      <LegalH2>6. How long we keep it</LegalH2>
      <p>
        Account and studio data last for as long as the account is open. Identity media, working
        production files, and finished commercials are kept so you can rerun work and download
        results, until you delete them or close the account.
      </p>
      <p>
        If you delete AI Identity or close the account, we queue private files for deletion. We keep
        payment and tax records for as long as the law requires, even after the account is closed.
        Backup copies may take a short extra period to disappear.
      </p>
      <p>
        Support messages are kept so we can continue a conversation and show a history in Admin
        support.
      </p>

      <LegalH2>7. Your choices</LegalH2>
      <p>You can:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>update profile details in studio settings;</li>
        <li>export a copy of account data from settings;</li>
        <li>delete AI Identity, which removes presenter reference files from the studio;</li>
        <li>close the account, which ends sign-in and queues deletion of production files;</li>
        <li>
          ask us through Help or Contact us to correct information, or to explain what we hold.
        </li>
      </ul>
      <p>
        If you are in South Africa or another country with similar privacy law, you may also have a
        right to object to certain processing or to lodge a complaint with a regulator. Closing the
        account does not erase a payment we are required to keep.
      </p>
      <p>
        You can unsubscribe from optional mail where we offer that choice. We will still send
        messages needed to run the account (security, production, billing, support).
      </p>

      <LegalH2>8. Children</LegalH2>
      <p>
        Production30 is not for anyone under 18. We do not knowingly collect identity media of
        children. If you believe we have, contact us and we will delete it.
      </p>

      <LegalH2>9. Security and international processing</LegalH2>
      <p>
        We use access controls, private storage, and short-lived download links. No method is
        perfect. Partners may process data in countries other than yours. By using the Service you
        understand that production and email may cross borders as needed to deliver the commercial.
      </p>

      <LegalH2>10. Changes</LegalH2>
      <p>
        We may update this notice. The “Last updated” date will change. For a material change we
        will try to notify you in the studio or by email.
      </p>
    </LegalPage>
  );
}
