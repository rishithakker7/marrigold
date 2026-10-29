import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata = {
  title: "Privacy Policy | Marrigold Events",
  description:
    "How Marrigold Events collects, uses, stores and protects your personal data, and your rights under Indian law.",
};

const UPDATED = "29 October 2026";
const EMAIL = "parul@marrigoldevents.com";
const PHONES = ["+91 9326787480", "+91 9619939848"];
const ADDRESS = "2402, Marathon Monte Vista, M.M. Marg, opp. Telephone Exchange, Mulund West, Mumbai 400080";

const H2 = "mt-12 font-serif text-3xl font-normal text-forest-950";
const P = "mt-4 text-base leading-relaxed text-forest-700";
const UL = "mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-forest-700";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        text="How we handle your personal data, in plain language."
      />

      <article className="mx-auto max-w-3xl px-6 py-20 sm:px-8 sm:py-28">
        <p className="text-sm uppercase tracking-[0.18em] text-forest-600">Last updated: {UPDATED}</p>

        <p className={P}>
          This policy explains how Marrigold Events (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects and uses personal data
          through this website. It is written to meet the Information Technology Act, 2000, the Information Technology
          (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the
          Digital Personal Data Protection Act, 2023 and its Rules, 2025. For the purposes of these laws we are the
          &ldquo;Data Fiduciary&rdquo; and you are the &ldquo;Data Principal&rdquo;.
        </p>

        <h2 className={H2}>1. What we collect</h2>
        <ul className={UL}>
          <li>
            <strong>Enquiry form:</strong> your name, phone number, email address, the service you are interested in,
            and any message you choose to write (for example your date, city and guest count).
          </li>
          <li>
            <strong>Technical data:</strong> basic server logs such as IP address, browser type and pages visited, which
            our hosting provider records to keep the site running and secure.
          </li>
          <li>
            <strong>Staff login:</strong> the studio&apos;s content management area uses a password and a session cookie.
            It is for authorised staff only and collects nothing from visitors.
          </li>
        </ul>
        <p className={P}>We do not ask for payment details, government IDs or any sensitive personal data through this website.</p>

        <h2 className={H2}>2. Why we use it</h2>
        <ul className={UL}>
          <li>To respond to your enquiry and arrange a consultation.</li>
          <li>To plan and quote for the event you ask us about.</li>
          <li>To keep the website secure and prevent spam or misuse.</li>
          <li>To meet legal obligations.</li>
        </ul>
        <p className={P}>
          We process your enquiry details only with your consent, which you give by ticking the box on the enquiry form.
          We do not use your details for marketing unless you separately ask us to, and we never sell your data.
        </p>

        <h2 className={H2}>3. Who we share it with</h2>
        <p className={P}>We share data only with service providers needed to run the website:</p>
        <ul className={UL}>
          <li>Vercel Inc., which hosts the website and stores enquiries and site content.</li>
          <li>Google, if you view the embedded map on our Contact page. Google may set its own cookies.</li>
          <li>Resend, which delivers the enquiry notification email to our team.</li>
          <li>WhatsApp (Meta), only if you choose to click the WhatsApp button to message us.</li>
        </ul>
        <p className={P}>
          These providers may store data on servers outside India. We may also disclose data if required by law or by a
          court or government authority.
        </p>

        <h2 className={H2}>4. Cookies</h2>
        <p className={P}>
          We use only essential cookies, such as the staff session cookie. We do not run advertising or tracking
          cookies. Embedded third-party content like Google Maps may set cookies under its own policy.
        </p>

        <h2 className={H2}>5. How long we keep it</h2>
        <p className={P}>
          We keep enquiry details for up to 12 months after your last interaction with us, or longer if you become a
          client and we need records for the event, accounts or legal reasons. After that we delete or anonymise them.
        </p>

        <h2 className={H2}>6. How we protect it</h2>
        <p className={P}>
          Access to enquiries is limited to authorised staff and protected by a password. The site is served over HTTPS.
          No system is completely secure, but we take reasonable safeguards, and if a personal data breach affects you we
          will inform you and the Data Protection Board of India as the law requires.
        </p>

        <h2 className={H2}>7. Your rights</h2>
        <p className={P}>Under the DPDP Act you may:</p>
        <ul className={UL}>
          <li>Ask for a summary of the personal data we hold about you and how it is used.</li>
          <li>Ask us to correct, complete or update it.</li>
          <li>Ask us to erase it.</li>
          <li>Withdraw your consent at any time. This will not affect what we did before you withdrew.</li>
          <li>Nominate another person to exercise these rights if you die or become unable to.</li>
          <li>Raise a grievance with us, and, if unresolved, complain to the Data Protection Board of India.</li>
        </ul>
        <p className={P}>To use any of these rights, write to the contact below. We aim to reply within 30 days.</p>

        <h2 className={H2}>8. Children</h2>
        <p className={P}>
          This website is meant for adults planning events. We do not knowingly collect personal data from anyone under
          18 without a parent or guardian&apos;s consent. If you believe a child has sent us data, contact us and we will
          delete it.
        </p>

        <h2 className={H2}>9. Contact and grievance officer</h2>
        <address className="mt-4 space-y-1 text-base not-italic leading-relaxed text-forest-700">
          <p className="font-semibold text-forest-950">Grievance Officer, Marrigold Events</p>
          <p>{ADDRESS}</p>
          <p>
            Email:{" "}
            <a href={`mailto:${EMAIL}`} className="underline underline-offset-4 hover:text-gold-700">
              {EMAIL}
            </a>
          </p>
          <p>Phone: {PHONES.join(" / ")}</p>
        </address>

        <h2 className={H2}>10. Changes to this policy</h2>
        <p className={P}>
          We may update this policy from time to time. The date at the top shows when it last changed. Continued use of
          the website after an update means you accept the revised policy. This policy is governed by the laws of India,
          and the courts at Mumbai have jurisdiction.
        </p>

        <p className="mt-14 text-sm text-forest-600">
          <Link href="/contact" className="underline underline-offset-4 hover:text-gold-700">
            Back to Contact
          </Link>
        </p>
      </article>
    </>
  );
}
