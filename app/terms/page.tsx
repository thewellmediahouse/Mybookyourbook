import type { Metadata } from "next";
import Link from "next/link";
import { LegalH2, LegalH3, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Working terms of use for Production30. Requires professional legal review before launch.",
};

const UPDATED = "25 August 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated={UPDATED}>
      <p>
        Production30 is a studio for business advertising: you brief us about your business, show us
        who you are, approve a Commercial Concept, and receive a finished 30-second
        commercial starring you. These Terms of use (“Terms”) govern the website, studio, and related
        services (the “Service”). They form an agreement between you and Production30 (“we”, “us”).
      </p>
      <p>
        By creating an account, ticking the boxes at signup, or using the Service, you agree to these
        Terms, the{" "}
        <Link href="/privacy" className="text-foreground underline">
          Privacy policy
        </Link>
        , and the{" "}
        <Link href="/acceptable-use" className="text-foreground underline">
          Acceptable use
        </Link>{" "}
        rules. If you do not agree, do not use the Service.
      </p>
      <p>
        If you use Production30 for a company, studio, or other organisation, you confirm you are
        allowed to bind that organisation. “You” then means both you and that organisation. The
        studio owner is responsible for teammates who use the same studio.
      </p>

      <LegalH2>1. What Production30 is — and is not</LegalH2>
      <p>
        Production30 is not a public art gallery, a stock-face library, or a tool for inventing
        strangers. It is for authorised business advertising. Typical path:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Brief us about your business.</li>
        <li>Show who you are with photos and a short reference video of the presenter.</li>
        <li>Review and approve a Commercial Concept. Concept work does not use an Ad Credit.</li>
        <li>Start production with 1 Ad Credit for 1 new commercial.</li>
        <li>Receive a finished commercial you can download from your studio.</li>
      </ul>
      <p>
        Public example videos on the marketing site are style references. They are not customer
        commercials and are not a promise of a particular result.
      </p>
      <p>
        We may change features, providers, or the look of the studio as we improve the Service. If a
        change removes something you already paid for, we will say so in plain language in the
        studio or by email.
      </p>

      <LegalH2>2. Eligibility</LegalH2>
      <p>
        You must be 18 or older to create an account. The presenter in photos and the reference
        video must also be an adult. Do not upload footage of children.
      </p>
      <p>
        You must provide accurate account details and keep them current. One person should not run
        multiple accounts to dodge limits, bans, or billing.
      </p>

      <LegalH2>3. Your account and studio</LegalH2>
      <p>
        You are responsible for your password and for activity in your account and studio, including
        teammates you invite. Tell us promptly through{" "}
        <Link href="/contact" className="text-foreground underline">
          Contact us
        </Link>{" "}
        or Help if you think someone else used your account.
      </p>
      <p>
        We may refuse, suspend, or close an account that we reasonably believe is unsafe, unpaid,
        abusive, or in breach of these Terms or Acceptable use.
      </p>

      <LegalH2>4. Your materials</LegalH2>
      <p>
        “Your materials” include the business brief, website or brand details you give us, logos,
        product photos, spoken words, and the presenter’s photos and reference video.
      </p>
      <p>You confirm that:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>you have the right to use the face, voice, logo, and copy you provide;</li>
        <li>
          you are the person shown and heard, or you have that person’s clear permission to use their
          likeness and voice for commercial advertising;
        </li>
        <li>you will not use Production30 to impersonate someone without authorisation;</li>
        <li>your materials do not infringe anyone else’s rights or break the law.</li>
      </ul>
      <p>
        You keep whatever rights you already have in your logo, photos, and other materials. You
        grant Production30 a limited licence to store, copy, and process those materials only as
        needed to run the studio, produce the commercial, deliver downloads, provide support, and
        meet the law. We do not sell your face as stock, and we do not run a public searchable face
        gallery.
      </p>

      <LegalH2>5. Finished commercials</LegalH2>
      <p>
        Subject to these Terms and Acceptable use, when a production completes you may use that
        finished commercial to advertise your own business — including on your website, social
        channels, and paid ads — for as long as you comply with these Terms.
      </p>
      <p>That permission does not let you:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>sell the commercial as stock footage or as someone else’s identity;</li>
        <li>present another person as the presenter without their permission;</li>
        <li>use the commercial for a purpose that would break Acceptable use.</li>
      </ul>
      <p>
        Production30 keeps the Service itself: the studio software, prompts, layouts, methods, and
        how we produce the work. Approving a Commercial Concept does not transfer those methods to
        you. You are responsible for how you publish the finished commercial and for any claims you
        make about your business in the brief or on screen.
      </p>
      <p>
        Commercials are produced to match the approved concept as closely as a production process
        allows. We do not guarantee a specific look in your head, advertising performance, or sales.
        Branding such as a phone number or website is applied so that written information stays
        accurate; it is not invented inside the filmed scene.
      </p>

      <LegalH2>6. Ad Credits, plans, and payment</LegalH2>
      <LegalH3>Ad Credits</LegalH3>
      <p>
        1 Ad Credit starts 1 new commercial production. Changing the concept before production does
        not use a credit. A new aspect ratio or a new production uses another Ad Credit. Credits are
        for use on Production30. They are not cash, are not transferable between unrelated
        customers, and have no value outside the Service except where the law requires otherwise.
      </p>
      <p>
        If we cannot complete a production because of a failure on our side, your Ad Credit comes
        back. That is not the same as money returned to your card.
      </p>
      <LegalH3>Prices and checkout</LegalH3>
      <p>
        Current packs and prices are on{" "}
        <Link href="/pricing" className="text-foreground underline">
          Pricing
        </Link>
        . Amounts may be in South African rand or US dollars, as shown at checkout. Taxes may be
        added where required. By paying, you authorise us and our card payment provider to charge
        the method you choose. We do not store full card numbers in the studio. The payment provider
        has its own terms.
      </p>
      <p>
        Credits are added only after the payment provider confirms the charge. A browser “success”
        page is not enough on its own.
      </p>
      <LegalH3>Plans</LegalH3>
      <p>
        If a recurring plan is available for your studio, fees are billed in advance for each period
        shown at purchase. We will tell you if a plan renews automatically. To stop a plan, send a
        Cancel plan message from Help (or{" "}
        <Link href="/contact" className="text-foreground underline">
          Contact us
        </Link>{" "}
        if you cannot sign in). Access continues until the end of the period already paid, unless
        the law requires something different. Monthly plans may be closed at self-serve checkout
        until the catalogue is connected; the studio will say so instead of taking a broken payment.
      </p>
      <LegalH3>Money returned</LegalH3>
      <p>
        Ask for money back with a Refund message from Help or Contact us. If we agree, we return the
        money through the payment provider and record it on that payment. We do not invent extra Ad
        Credits to stand in for a card refund. Consumer-protection law in your country may give you
        rights we cannot contract out of; those rights still apply.
      </p>

      <LegalH2>7. Privacy</LegalH2>
      <p>
        How we handle account data, identity media, and processors is described in the{" "}
        <Link href="/privacy" className="text-foreground underline">
          Privacy policy
        </Link>
        . Footage and brand files may be processed through a video production partner, footage
        enhancement partner, finishing/branding step, cloud hosting and storage, payment provider,
        and email provider in order to produce and deliver your commercial.
      </p>

      <LegalH2>8. Acceptable use</LegalH2>
      <p>
        You must follow{" "}
        <Link href="/acceptable-use" className="text-foreground underline">
          Acceptable use
        </Link>
        . In short: Production30 is for authorised business advertising. No celebrity impersonation,
        no public cloning library, no anonymous third-party impersonation, no public searchable face
        gallery, and no illegal or harmful advertising.
      </p>
      <p>
        Report misuse with the Abuse category in Help, or from Contact us. We may remove content,
        suspend a studio, or close an account.
      </p>

      <LegalH2>9. Availability, support, and changes</LegalH2>
      <p>
        We aim to keep the studio working, but we do not promise uninterrupted access. Maintenance,
        partner outages, or legal requirements may pause production. Support is by email through
        Help and Contact us — not live chat. We do not guarantee a response time.
      </p>
      <p>
        We may update these Terms. The “Last updated” date will change. For a material change we
        will try to notify you in the studio or by email. If you continue to use the Service after
        an update, the new Terms apply. If you do not agree, stop using the Service and close your
        account.
      </p>

      <LegalH2>10. Account closure</LegalH2>
      <p>
        You may close your account from studio settings, subject to any in-flight production and
        team members that must be removed first. We revoke sessions, queue deletion of private
        production files and identity media, and keep only records we must keep for tax, payment,
        and legal reasons. Closed accounts cannot sign in.
      </p>
      <p>
        We may close or suspend access if you breach these Terms, fail to pay, create risk for other
        people, or if we stop offering the Service. Unused Ad Credits are not cashed out except
        where the law requires.
      </p>

      <LegalH2>11. Disclaimers</LegalH2>
      <p>
        The Service is provided as it is and as available. To the fullest extent the law allows, we
        do not give extra warranties that the commercial will be error-free, that it will match a
        private expectation, or that it will achieve a marketing result. You remain responsible for
        your advertising claims and for having the rights described in section 4.
      </p>

      <LegalH2>12. Liability</LegalH2>
      <p>
        Nothing in these Terms limits liability that the law does not allow us to limit — including
        for fraud, or death or personal injury caused by negligence, where that rule applies.
      </p>
      <p>
        Subject to that, Production30 is not liable for lost profits, lost goodwill, or indirect
        loss arising from your use of the Service. Our total liability for a claim relating to the
        Service is limited to the fees you actually paid us for the Service in the 12 months before
        the claim, except where the law sets a higher floor.
      </p>

      <LegalH2>13. Indemnity</LegalH2>
      <p>
        You will cover Production30 for losses, claims, and reasonable legal costs arising from your
        materials, your advertising claims, your misuse of the Service, or your breach of these
        Terms or Acceptable use — including a complaint that you used someone else’s face, voice, or
        brand without permission.
      </p>

      <LegalH2>14. Governing law</LegalH2>
      <p>
        These Terms are governed by the laws of the Republic of South Africa. Courts of South Africa
        have jurisdiction, except where consumer law in your country gives you a right to sue
        elsewhere that cannot be waived.
      </p>

      <LegalH2>15. Contact</LegalH2>
      <p>
        Questions about these Terms:{" "}
        <Link href="/contact" className="text-foreground underline">
          Contact us
        </Link>
        , Help after you sign in, or email Accounts@production30.com.
      </p>
    </LegalPage>
  );
}
