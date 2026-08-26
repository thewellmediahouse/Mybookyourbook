import type { Metadata } from "next";
import Link from "next/link";
import { LegalH2, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Acceptable use",
  description:
    "Production30 is for authorised business advertising. Requires professional legal review before launch.",
};

const UPDATED = "25 August 2026";

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable use" updated={UPDATED}>
      <p>
        Production30 is for authorised business advertising. These rules sit with the{" "}
        <Link href="/terms" className="text-foreground underline">
          Terms of use
        </Link>
        . If they conflict with marketing copy, these rules win.
      </p>
      <p>
        Report a problem with the Abuse category in Help, or from{" "}
        <Link href="/contact" className="text-foreground underline">
          Contact us
        </Link>
        . Use Abuse if someone is using Production30 to impersonate a person without permission.
      </p>

      <LegalH2>1. What you may use Production30 for</LegalH2>
      <p>You may use the studio to produce a commercial that advertises a business you are allowed to represent, starring a presenter who has agreed to appear.</p>
      <p>You must have the right to use the face, voice, logo, product shots, music you add later, and copy you provide.</p>

      <LegalH2>2. Identity and impersonation</LegalH2>
      <p>Do not use Production30 to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>impersonate a celebrity, public figure, or private person without their authorisation;</li>
        <li>build a public cloning library or a catalogue of other people’s faces;</li>
        <li>run a public searchable face gallery;</li>
        <li>upload photos or a reference video of someone who has not given permission;</li>
        <li>upload footage of anyone under 18;</li>
        <li>pretend the presenter is a real customer, doctor, or other person they are not, in a way that would mislead a viewer.</li>
      </ul>
      <p>
        Another person may be the presenter only if you have their explicit authorisation. The
        studio records that consent before identity files are used.
      </p>

      <LegalH2>3. Advertising that is not allowed</LegalH2>
      <p>Do not use the Service to create or spread commercials or briefs that:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>are illegal where you are or where we operate;</li>
        <li>promote scams, phishing, pyramid schemes, or fake investment or miracle claims;</li>
        <li>infringe copyright, trade marks, or someone else’s brand;</li>
        <li>include sexual content, pornography, or exploitation;</li>
        <li>include extreme violence, hate, or harassment aimed at a person or group;</li>
        <li>promote terrorism, weapons trafficking, or other serious crime;</li>
        <li>dox someone (publish private contact or identity details to harm them);</li>
        <li>target or sexualise children in any way;</li>
        <li>are designed to deceive voters or impersonate a government or bank.</li>
      </ul>
      <p>
        You are responsible for advertising law that applies to your industry (for example health or
        financial claims). Approving a Commercial Concept does not make a false claim lawful.
      </p>

      <LegalH2>4. Technical misuse</LegalH2>
      <p>Do not:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>probe, overload, or break the studio or other customers’ workspaces;</li>
        <li>scrape the Service with bots except ordinary use of a web browser;</li>
        <li>try to extract underlying production systems or reuse them to build a competing factory from our private files;</li>
        <li>share your password or sell access to your studio;</li>
        <li>bypass payment, credit, or suspension controls;</li>
        <li>upload malware or anything intended to damage another person’s device.</li>
      </ul>

      <LegalH2>5. Spam and bulk abuse</LegalH2>
      <p>
        Do not use Production30 as a bulk content mill for junk ads, unsolicited campaigns, or to
        harvest other users’ details. Team seats are for people who work on your studio, not for
        anonymous public access.
      </p>

      <LegalH2>6. What we may do</LegalH2>
      <p>
        We may refuse a brief, stop a production, remove files, suspend a member, or close a studio
        when we reasonably believe these rules, the Terms, or the law have been broken — or when
        someone reports a genuine impersonation or rights complaint. We may keep records needed to
        handle that complaint. We may tell law enforcement when the law requires it.
      </p>
      <p>
        We are not obliged to monitor every brief, but we may review materials when a production,
        payment, or report requires it.
      </p>

      <LegalH2>7. Your commercials after download</LegalH2>
      <p>
        These rules still apply to how you use a finished commercial. Do not recut it to impersonate
        someone, to advertise a different business you do not represent, or to do anything in
        section 2 or 3.
      </p>
    </LegalPage>
  );
}
