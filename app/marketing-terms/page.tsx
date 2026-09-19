import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Marketing AI Service Terms — Belan AI",
  description:
    "Service terms for the Belan Marketing AI platform: gamified SMS marketing for restaurants. Incorporated by reference into every signed Belan Order Form.",
  alternates: {
    canonical: "https://belan.tech/marketing-terms",
  },
  robots: { index: true, follow: true },
};

const VERSION = "1.1";
const EFFECTIVE_DATE = "September 17, 2026";
const COMPANY_NAME = "Yusra Institute LLC";
const DBA = "Belan AI";
const CONTACT_EMAIL = "nayeem@belan.tech";
const CONTACT_PHONE = "(203) 300-7233";
const CONTACT_ADDRESS = "Plano, TX";

const ORDER_FORMS = [
  { months: 3, discount: "LIST PRICE", href: "/contracts/Belan-Marketing-AI-Order-Form-3-Month.pdf" },
  { months: 6, discount: "$100 OFF PER LOCATION", href: "/contracts/Belan-Marketing-AI-Order-Form-6-Month.pdf" },
  { months: 12, discount: "$200 OFF PER LOCATION", href: "/contracts/Belan-Marketing-AI-Order-Form-12-Month.pdf" },
];

const TOC: { id: string; label: string }[] = [
  { id: "agreement", label: "The Agreement and the Order Form" },
  { id: "term", label: "Term and Minimum Commitment" },
  { id: "fees", label: "Fees and Payment" },
  { id: "customer", label: "What the Customer Must Do" },
  { id: "belan", label: "What Belan Will Do" },
  { id: "messaging", label: "Messaging, Carriers and the Phone Number" },
  { id: "ip", label: "Intellectual Property and Branding" },
  { id: "data", label: "Customer Data and Privacy" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "warranties", label: "Warranties and Disclaimers" },
  { id: "liability", label: "Indemnities and Limits on Liability" },
  { id: "termination", label: "Suspension, Termination and Early Exit" },
  { id: "general", label: "General" },
  { id: "exhibit-a", label: "Exhibit A: The Services" },
  { id: "exhibit-b", label: "Exhibit B: Fees" },
  { id: "exhibit-c", label: "Exhibit C: Messaging Compliance Standards" },
  { id: "exhibit-d", label: "Exhibit D: Point-of-Sale Access Authorization" },
];

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-black/80 font-bold mb-3">{children}</p>;
}

function Clause({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <p className="text-black/80 font-bold mb-3">
      <span className="text-black">{n}</span> <strong className="text-black">{title}.</strong>{" "}
      {children}
    </p>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
      {CONTACT_EMAIL}
    </a>
  );
}

export default function MarketingTermsPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* Nav */}
      <nav className="border-b-2 border-black px-4 sm:px-8 xl:px-16 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BelanLogo.png"
            alt="Belan AI"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border-2 border-black object-cover"
          />
          <span className="font-black text-black text-sm tracking-widest">BELAN AI</span>
        </Link>
        <Link
          href="/register"
          className="bg-black text-white font-bold text-xs px-5 py-2.5 border-2 border-black tracking-widest hover:bg-white hover:text-black transition-colors"
        >
          GET STARTED
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Header */}
        <div
          className="inline-block border-2 border-black px-3 py-1.5 text-xs font-bold mb-6 tracking-widest"
          style={{ background: "#a4e5f8" }}
        >
          LEGAL
        </div>
        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-black leading-tight mb-4">
          Marketing AI Service Terms
        </h1>
        <p className="text-sm font-bold text-black/50 mb-4">
          Version {VERSION} &nbsp;|&nbsp; Effective {EFFECTIVE_DATE} &nbsp;|&nbsp; {COMPANY_NAME} d/b/a{" "}
          {DBA}
        </p>
        <p className="text-black/80 font-bold mb-10 border-l-4 border-black pl-4">
          These terms apply to the Belan Marketing AI platform and are incorporated by reference into
          every Belan Order Form. The Order Form states the Customer, the covered locations, the
          Monthly Fee and the Initial Term. Together, the signed Order Form and these terms are the
          &ldquo;Agreement.&rdquo; Sections 1 to 13 are the binding terms; the Exhibits describe the
          Services, the fees, the messaging rules and the point-of-sale authorization.
        </p>

        {/* Order Form downloads */}
        <section id="order-form" className="border-2 border-black p-6 mb-12 scroll-mt-24" style={{ background: "#f4f1fb" }}>
          <p className="font-black text-xs uppercase tracking-widest mb-2">Order Form (PDF)</p>
          <p className="text-black/80 font-bold mb-4">
            The two-page Order Form a Customer signs. Pick the Initial Term; every version incorporates these
            terms. Longer terms carry a discount (see Section 3.9).
          </p>
          <div className="flex flex-wrap gap-3">
            {ORDER_FORMS.map((f) => (
              <a
                key={f.months}
                href={f.href}
                download
                className="inline-flex items-center gap-2 bg-black text-white font-bold text-xs px-4 py-2.5 border-2 border-black tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                {f.months}-MONTH · {f.discount}
              </a>
            ))}
          </div>
          <p className="text-xs font-bold text-black/50 mt-3">
            Form v{VERSION}. Sign electronically or print, sign and scan. Questions: <Mail />.
          </p>
        </section>

        {/* TOC */}
        <nav className="border-2 border-black p-6 mb-12 bg-gray-50">
          <p className="font-black text-xs uppercase tracking-widest mb-4">Contents</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm font-bold text-black/70">
            {TOC.slice(0, 13).map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="hover:text-black underline">
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
          <ul className="space-y-1.5 text-sm font-bold text-black/70 mt-3">
            {TOC.slice(13).map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="hover:text-black underline">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12 text-sm sm:text-base leading-relaxed">
          {/* 1 */}
          <section>
            <H2 id="agreement">1. The Agreement and the Order Form</H2>
            <Clause n="1.1" title="The Services">
              Belan will provide the Customer with access to the Belan Marketing AI platform, described
              in Exhibit A, including a dedicated marketing phone number, game-based and promotional
              text-message campaigns, branded coupon, sign-up and referral pages, point-of-sale
              integration where available, customer history and revenue reporting, onboarding, and
              support (together, the &ldquo;Services&rdquo;).
            </Clause>
            <Clause n="1.2" title="The Order Form">
              The Order Form is the document the Customer signs. It identifies the Customer, the
              restaurant location or locations covered, the Monthly Fee, the Initial Term and any
              promotion. By signing the Order Form the Customer accepts these terms and commits to the
              Services for the whole Initial Term.
            </Clause>
            <Clause n="1.3" title="Order of precedence">
              If the Order Form, the body of these terms and an Exhibit conflict, the Order Form
              controls, then the body, then the Exhibits.
            </Clause>
            <Clause n="1.4" title="Definitions">
              &ldquo;Belan&rdquo; means {COMPANY_NAME} d/b/a {DBA}. &ldquo;Contacts&rdquo; means the
              phone numbers and related details the Customer adds to the Services. &ldquo;Customer
              Data&rdquo; means Contacts, campaign settings, order data pulled from the
              Customer&rsquo;s point of sale, and anything else the Customer or its customers put into
              the Services. &ldquo;Consent Records&rdquo; means the evidence Belan keeps that a Contact
              agreed to receive texts (source, timestamp, IP address, message log, and similar).
              &ldquo;Service Start Date&rdquo; means the date Belan provisions the Customer&rsquo;s
              marketing phone number, which Belan will confirm in writing.
            </Clause>
          </section>

          {/* 2 */}
          <section>
            <H2 id="term">2. Term and Minimum Commitment</H2>
            <Clause n="2.1" title="Initial Term">
              The Agreement starts on the date the last party signs the Order Form and continues for
              the Initial Term stated on the Order Form, measured from the Service Start Date.
            </Clause>
            <Clause n="2.2" title="Renewal">
              After the Initial Term, the Agreement renews automatically month to month. Either party
              may cancel a renewal period by giving the other at least 30 days&rsquo; written notice.
              Cancellation takes effect at the end of the monthly billing period in which the 30 days
              expire.
            </Clause>
            <Clause n="2.3" title="Minimum commitment">
              The Customer commits to pay the Monthly Fee for every location on the Order Form for the
              whole Initial Term. This commitment is the basis on which Belan provisions the number,
              registers it with carriers and onboards the Customer. Section 12.3 explains what happens
              if the Customer ends the Agreement early.
            </Clause>
          </section>

          {/* 3 */}
          <section>
            <H2 id="fees">3. Fees and Payment</H2>
            <Clause n="3.1" title="Monthly Fee and plans">
              The Customer will pay the Monthly Fee for the plan selected on the Order Form (Tier 1,
              Tier 2 or Tier 3, as priced in Exhibit B) for each restaurant location covered. Every
              location on an Order Form is on the same plan. The first Monthly Fee is charged on the
              Service Start Date and each following fee on the same day of each month.
            </Clause>
            <Clause n="3.2" title="Messages and overage">
              Each plan includes the number of messages per location per month shown in Exhibit B. A
              &ldquo;message&rdquo; is one text of up to 306 plain characters (134 when emoji or other
              non-GSM characters are used), about 25 of which carry the required opt-out line.
              Included messages reset each month and do not roll over; inbound messages from Contacts
              are never charged; each location may run up to two campaign sends per week. Sends are
              never blocked for exceeding the plan: messages above the plan are billed monthly in
              arrears at the plan&rsquo;s per-message overage rate in Exhibit B, and a location that
              exceeds its plan in a month moves up to the next plan from its next billing date.
              Overage above Tier 3 stays at the Tier 3 rate, and volumes above 12,000 messages a month
              are quoted separately. Belan shows an estimated message count before every campaign
              send, and the Customer controls how many Contacts receive each send.
            </Clause>
            <Clause n="3.3" title="Optional services">
              Add-ons such as the branded RCS sender are billed as shown in Exhibit B or the relevant
              addendum. Carrier registration fees are paid to third parties and are non-refundable
              once submitted.
            </Clause>
            <Clause n="3.4" title="Payment method">
              The Customer authorizes Belan to charge the payment method on file on each due date. If
              a charge fails, Belan will retry and notify the Customer, and may suspend the Services
              under Section 12.4 until the charge succeeds.
            </Clause>
            <Clause n="3.5" title="Taxes">
              Fees exclude sales and similar taxes. The Customer pays any taxes that apply, other than
              taxes on Belan&rsquo;s income.
            </Clause>
            <Clause n="3.6" title="Price changes">
              Belan will not raise the Monthly Fee during the Initial Term. Afterwards Belan may
              change fees with at least 30 days&rsquo; written notice; the Customer may cancel under
              Section 2.2 before the change takes effect. A plan change driven by the Customer&rsquo;s
              usage under Section 3.2 is not a price change.
            </Clause>
            <Clause n="3.7" title="Refunds">
              Fees are non-refundable except where the Agreement says otherwise.
            </Clause>
            <Clause n="3.8" title="Multi-location discount">
              When an Order Form covers two locations, the Monthly Fee for every location is reduced
              by 10%. When it covers three or more, every location is reduced by 20%. Locations added
              later join the same plan and Initial Term end date, and the discount is recalculated
              from the next billing date.
            </Clause>
            <Clause n="3.9" title="Term discount">
              A six-month Initial Term earns a $100 credit per location and a twelve-month Initial
              Term earns a $200 credit per location, applied to the final invoice of the Initial
              Term. A three-month Initial Term is at list price. The credit is earned by completing
              the Initial Term and is forfeited if the Agreement ends early under Section 12.3.
            </Clause>
          </section>

          {/* 4 */}
          <section>
            <H2 id="customer">4. What the Customer Must Do</H2>
            <Clause n="4.1" title="Consent for every Contact">
              The Customer will only add Contacts who have given prior express written consent to
              receive marketing text messages from the Customer, in the form required by the
              Telephone Consumer Protection Act, the CTIA Messaging Principles, carrier rules and any
              applicable state law. When importing Contacts, the Customer will confirm this in the
              Services, and that confirmation is recorded against every imported Contact. Contacts
              collected through Belan&rsquo;s sign-up, referral and reply flows are documented by
              Belan.
            </Clause>
            <Clause n="4.2" title="No purchased or scraped lists">
              The Customer will not add Contacts obtained from purchased lists, third-party
              marketplaces, delivery apps, or any source that did not involve the Contact agreeing to
              hear from the Customer by text.
            </Clause>
            <Clause n="4.3" title="Lawful offers">
              The Customer is responsible for the legality of every prize, discount and promotion it
              runs, including any rules that apply to games of chance, sweepstakes, alcohol, tobacco,
              cannabis and age-restricted products in its state. Belan may decline to send content
              that it reasonably believes breaks the law or carrier rules (see Exhibit C).
            </Clause>
            <Clause n="4.4" title="Honoring offers">
              The Customer will honor every coupon and prize the Services issue on its behalf until
              the coupon&rsquo;s stated expiry or, if earlier, the termination date.
            </Clause>
            <Clause n="4.5" title="Accurate information">
              During onboarding the Customer will provide true and complete business information for
              carrier registration of its phone number or RCS sender, and will keep its contact and
              billing details current.
            </Clause>
            <Clause n="4.6" title="Point-of-sale access">
              Where the Customer connects a point-of-sale system, the Customer authorizes Belan to
              access it as described in Exhibit D. The Customer will provide credentials only for
              systems it is entitled to connect.
            </Clause>
            <Clause n="4.7" title="Acceptable use">
              The Customer will not use the Services to send content that is unlawful, deceptive,
              abusive, or that falls into carrier-prohibited categories listed in Exhibit C, and will
              not attempt to interfere with the Services or use them for anyone other than the
              locations on the Order Form.
            </Clause>
          </section>

          {/* 5 */}
          <section>
            <H2 id="belan">5. What Belan Will Do</H2>
            <Clause n="5.1" title="Provide the Services">
              Belan will provide the Services described in Exhibit A with reasonable skill and care.
            </Clause>
            <Clause n="5.2" title="Handle opt-outs">
              Belan will process STOP, UNSUBSCRIBE and similar replies automatically on every number,
              honor HELP requests, and stop marketing texts to any Contact that opts out.
            </Clause>
            <Clause n="5.3" title="Keep Consent Records">
              Belan will keep Consent Records for every Contact and make them available to the
              Customer on request during the term and for the retention period in Section 8.4.
            </Clause>
            <Clause n="5.4" title="Onboarding and support">
              Belan will provide an onboarding session, help the Customer connect its point of sale
              and brand its pages, and answer support requests within one business day by email or
              text at the address in Exhibit A.
            </Clause>
            <Clause n="5.5" title="Security">
              Belan will maintain reasonable administrative, technical and physical safeguards for
              Customer Data, store point-of-sale credentials in an encrypted secrets store, and never
              display those credentials after entry.
            </Clause>
            <Clause n="5.6" title="Availability">
              Belan will use commercially reasonable efforts to keep the Services available at all
              times other than scheduled maintenance, which Belan will announce in advance where
              practical. Scheduled sends that fail because of an outage on Belan&rsquo;s side will be
              re-sent or credited at the Customer&rsquo;s option.
            </Clause>
          </section>

          {/* 6 */}
          <section>
            <H2 id="messaging">6. Messaging, Carriers and the Phone Number</H2>
            <Clause n="6.1" title="Number">
              Belan will provision a dedicated marketing phone number for the Customer and register it
              with carriers under the Customer&rsquo;s brand. The number is provided as part of the
              Services and remains Belan&rsquo;s. On termination the number is released back to Belan
              and is not transferred to the Customer.
            </Clause>
            <Clause n="6.2" title="Carrier filtering">
              Mobile carriers apply their own filtering and may delay or block messages. Belan does
              not guarantee delivery of any particular message and is not responsible for carrier
              decisions, but will work with the Customer to resolve registration or filtering issues.
            </Clause>
            <Clause n="6.3" title="No unsolicited opt-in requests">
              Belan will not text people who have not opted in in order to ask them to opt in, unless
              a future written addendum, compliant with law at that time, says otherwise.
            </Clause>
          </section>

          {/* 7 */}
          <section>
            <H2 id="ip">7. Intellectual Property and Branding</H2>
            <Clause n="7.1" title="Belan's platform">
              Belan owns the Services, the software, the game catalog, the message templates, and all
              improvements. The Customer receives a non-exclusive, non-transferable right to use the
              Services during the term for its locations on the Order Form.
            </Clause>
            <Clause n="7.2" title="Customer's brand">
              The Customer owns its name, logo, photos and menu content and grants Belan a license to
              use them to run the Services on the Customer&rsquo;s behalf, including on coupon,
              sign-up and referral pages and in link previews.
            </Clause>
            <Clause n="7.3" title="Reference customer">
              Belan may name the Customer as a customer and use its logo in Belan&rsquo;s marketing
              materials unless the Customer opts out by email at any time.
            </Clause>
            <Clause n="7.4" title="Feedback">
              Suggestions the Customer gives about the Services may be used by Belan without
              obligation.
            </Clause>
          </section>

          {/* 8 */}
          <section>
            <H2 id="data">8. Customer Data and Privacy</H2>
            <Clause n="8.1" title="Ownership">
              The Customer owns Customer Data. Belan processes it only to provide, secure and improve
              the Services and as the Agreement allows.
            </Clause>
            <Clause n="8.2" title="Aggregated data">
              Belan may use data that does not identify the Customer or any individual (for example,
              response rates by game type) to improve and promote the Services.
            </Clause>
            <Clause n="8.3" title="Export">
              During the term and for 30 days afterwards, the Customer may export its Contacts and
              Consent Records from the Services or by request.
            </Clause>
            <Clause n="8.4" title="Retention and deletion">
              After the export window, Belan will delete Customer Data within 60 days, except that
              Belan will retain Consent Records, opt-out records and message logs for four (4) years
              after the relevant message, as evidence of compliance, and may retain backups on their
              normal deletion cycle.
            </Clause>
            <Clause n="8.5" title="Privacy law">
              Each party will comply with privacy laws that apply to it. Belan&rsquo;s{" "}
              <Link href="/privacy-policy" className="underline hover:text-black">
                Privacy Policy
              </Link>{" "}
              describes how Belan handles personal information of the Customer&rsquo;s customers.
            </Clause>
          </section>

          {/* 9 */}
          <section>
            <H2 id="confidentiality">9. Confidentiality</H2>
            <P>
              Each party will keep the other&rsquo;s non-public business information confidential, use
              it only for the Agreement, and protect it with at least reasonable care, for the term
              and three years afterwards. This does not apply to information that is public through no
              fault of the receiving party, already known to it, independently developed, or required
              to be disclosed by law (with prompt notice where allowed). Pricing on the Order Form is
              Belan&rsquo;s confidential information.
            </P>
          </section>

          {/* 10 */}
          <section>
            <H2 id="warranties">10. Warranties and Disclaimers</H2>
            <Clause n="10.1" title="Mutual">
              Each party warrants that it has the authority to enter into the Agreement and that doing
              so does not breach any other agreement it has.
            </Clause>
            <Clause n="10.2" title="Customer">
              The Customer warrants that its Contacts, offers and content comply with Section 4.
            </Clause>
            <Clause n="10.3" title="Belan">
              Belan warrants that the Services will perform materially as described in Exhibit A. The
              Customer&rsquo;s remedy for breach of this warranty is for Belan to fix the problem or,
              if Belan cannot within 30 days, for the Customer to terminate the affected Services and
              receive a refund of prepaid fees for the unused period.
            </Clause>
            <Clause n="10.4" title="No guarantee of results">
              Belan does not promise any particular number of replies, redemptions, visits or revenue.
              Results depend on the Customer&rsquo;s offers, list, and market.
            </Clause>
            <Clause n="10.5" title="Disclaimer">
              Except as stated in this Section, the Services are provided &ldquo;as is&rdquo; and
              Belan disclaims all other warranties, express or implied, including merchantability,
              fitness for a particular purpose and non-infringement.
            </Clause>
          </section>

          {/* 11 */}
          <section>
            <H2 id="liability">11. Indemnities and Limits on Liability</H2>
            <Clause n="11.1" title="By the Customer">
              The Customer will defend and indemnify Belan against third-party claims, fines and
              penalties arising from (a) Contacts added without the consent required by Section 4.1
              or from prohibited sources under Section 4.2, (b) unlawful offers or content under
              Sections 4.3 and 4.7, or (c) point-of-sale credentials the Customer was not entitled to
              provide.
            </Clause>
            <Clause n="11.2" title="By Belan">
              Belan will defend and indemnify the Customer against third-party claims that the
              Services, as provided by Belan and used as permitted, infringe a United States patent,
              copyright or trademark. Belan may modify or replace the Services to avoid infringement,
              or terminate the affected Services and refund prepaid unused fees.
            </Clause>
            <Clause n="11.3" title="Procedure">
              The indemnified party must promptly notify the other, give it control of the defense
              and settlement, and cooperate reasonably.
            </Clause>
            <Clause n="11.4" title="Cap">
              Except for the indemnities above, a party&rsquo;s breach of Section 9, the
              Customer&rsquo;s payment obligations, or a party&rsquo;s willful misconduct, each
              party&rsquo;s total liability under the Agreement is limited to the fees paid or payable
              by the Customer in the twelve (12) months before the event giving rise to the claim.
            </Clause>
            <Clause n="11.5" title="Excluded damages">
              Neither party is liable for lost profits, lost revenue, loss of data, or indirect,
              incidental, special or consequential damages, even if advised of their possibility,
              except for the exclusions in Section 11.4.
            </Clause>
          </section>

          {/* 12 */}
          <section>
            <H2 id="termination">12. Suspension, Termination and Early Exit</H2>
            <Clause n="12.1" title="For breach">
              Either party may terminate the Agreement if the other materially breaches it and does
              not cure within 10 days of written notice. Belan may terminate immediately on notice if
              the Customer breaches Section 4.1, 4.2 or 4.7, because those breaches expose Belan and
              its carriers to legal risk.
            </Clause>
            <Clause n="12.2" title="For insolvency">
              Either party may terminate if the other becomes insolvent, makes an assignment for the
              benefit of creditors, or has a bankruptcy petition filed that is not dismissed within 60
              days.
            </Clause>
            <Clause n="12.3" title="Early termination by the Customer">
              If the Customer terminates the Agreement during the Initial Term for any reason other
              than Belan&rsquo;s uncured material breach under Section 12.1 or Section 10.3, the
              Customer will pay, as a reasonable estimate of Belan&rsquo;s loss and not a penalty, a
              flat early termination fee of $150 for each covered location, due on the termination
              date, and forfeits any term discount under Section 3.9 not yet credited.
            </Clause>
            <Clause n="12.4" title="Suspension">
              Belan may suspend the Services, after notice where practical, if a charge for fees has
              failed and has not been made good, if the Customer&rsquo;s use creates a legal, security
              or carrier-reputation risk, or if a carrier requires it. Belan will restore the Services
              promptly once the cause is resolved. Suspension does not pause the Initial Term or the
              Monthly Fee where the suspension is caused by the Customer.
            </Clause>
            <Clause n="12.5" title="What happens on termination">
              Campaigns stop at the termination date; coupons issued but not yet redeemed are
              cancelled and deleted, and the Customer has no further obligation to honor them; the
              number is handled under Section 6.1; data is handled under Section 8; and fees accrued
              to the termination date, plus any early termination fee, become due. Sections 3, 7.1,
              8, 9, 10.5, 11, 12.5 and 13 survive termination.
            </Clause>
          </section>

          {/* 13 */}
          <section>
            <H2 id="general">13. General</H2>
            <Clause n="13.1" title="Governing law and venue">
              The Agreement is governed by the laws of the State of Texas, without regard to
              conflict-of-law rules. The state and federal courts in Collin County, Texas have
              exclusive jurisdiction, and each party submits to them. Before filing any claim other
              than for non-payment or injunctive relief, the parties will try in good faith for 30
              days to resolve the dispute between senior representatives.
            </Clause>
            <Clause n="13.2" title="Notices">
              Notices must be in writing and sent by email to the addresses on the Order Form (with
              confirmation of receipt), or to Belan at <Mail />. Routine service communications may
              be sent through the Services or by text.
            </Clause>
            <Clause n="13.3" title="Assignment">
              Neither party may assign the Agreement without the other&rsquo;s written consent,
              except that either party may assign it to a successor to substantially all of its
              business or assets on written notice. The Agreement binds permitted successors and
              assigns.
            </Clause>
            <Clause n="13.4" title="Force majeure">
              Neither party is liable for delay or failure caused by events beyond its reasonable
              control, including carrier or network outages, provided it uses reasonable efforts to
              resume performance. Payment obligations are not excused.
            </Clause>
            <Clause n="13.5" title="Independent contractors">
              The parties are independent contractors. Nothing creates a partnership, franchise,
              joint venture, agency or employment relationship.
            </Clause>
            <Clause n="13.6" title="Entire agreement; changes">
              The signed Order Form, these terms and the Exhibits are the entire agreement about their
              subject and replace prior discussions. Changes must be in a writing signed by both
              parties, except that Belan may update Exhibit A to add features or Exhibit C to reflect
              changes in law or carrier rules, on notice, provided the changes do not materially
              reduce the Services. The version of these terms in effect on the date the Customer
              signs the Order Form governs that Order Form.
            </Clause>
            <Clause n="13.7" title="Waiver and severability">
              A party&rsquo;s failure to enforce a term is not a waiver. If any term is
              unenforceable, it will be enforced to the maximum extent permitted and the rest of the
              Agreement stays in effect.
            </Clause>
            <Clause n="13.8" title="Counterparts and e-signature">
              The Order Form may be signed in counterparts and electronically; electronic signatures
              and scanned copies are as effective as originals.
            </Clause>
          </section>

          {/* Exhibit A */}
          <section>
            <H2 id="exhibit-a">Exhibit A: The Services</H2>
            <Clause n="A.1" title="Platform">
              The Belan Marketing AI dashboard at belan.tech, including:
            </Clause>
            <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2 mb-4">
              <li>
                A dedicated marketing phone number for each covered location, registered with
                carriers under the Customer&rsquo;s brand.
              </li>
              <li>
                Game campaigns from Belan&rsquo;s catalog (trivia, pick a number, roll the dice,
                closest guess, random draw, everyone wins) and a build-your-own game editor;
                promotional messages; customer groups; scheduled sends; test sends to the
                Customer&rsquo;s own phone before launch; pause and resume.
              </li>
              <li>
                Automatic grading of replies and sending of winner and consolation coupons, with
                expiry windows the Customer sets.
              </li>
              <li>
                Branded coupon pages, link previews, sign-up (QR) pages and referral pages using the
                Customer&rsquo;s logo, color and photos.
              </li>
              <li>
                Spreadsheet import of consented Contacts with per-import consent confirmation; QR and
                web sign-up with consent capture; referral bonuses.
              </li>
              <li>
                Point-of-sale integration where available (Clover at signature; others as Belan
                releases them): coupon redemption creates a discount at the register, and orders that
                used a coupon are matched to campaigns in the Revenue view.
              </li>
              <li>
                Customer view: every text, reply, game, coupon and point-of-sale order for a Contact,
                in order.
              </li>
              <li>Automatic handling of STOP, HELP and opt-out keywords; Consent Records.</li>
            </ul>
            <Clause n="A.2" title="Onboarding">
              One onboarding session by video call covering account setup, point-of-sale connection,
              branding, sign-up link, Contact import and the first campaign, plus a follow-up check-in
              within the first two weeks.
            </Clause>
            <Clause n="A.3" title="Support">
              Email <Mail /> and text support, Monday to Friday, 9 AM to 6 PM Central, with a first
              response within one business day. Outages affecting sends are treated as urgent at any
              time.
            </Clause>
            <Clause n="A.4" title="Changes">
              Belan may add, improve or replace features. Belan will give at least 30 days&rsquo;
              notice before removing a feature the Customer actively uses.
            </Clause>
          </section>

          {/* Exhibit B */}
          <section>
            <H2 id="exhibit-b">Exhibit B: Fees</H2>
            <div className="overflow-x-auto border-2 border-black mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black text-white text-left">
                    <th className="px-3 py-2 font-black">Item</th>
                    <th className="px-3 py-2 font-black">Amount</th>
                    <th className="px-3 py-2 font-black">When billed</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-black/80">
                  {[
                    ["Tier 1", "$200 per covered location per month · 2,500 messages included · overage 8.0¢ per message", "Monthly in advance from the Service Start Date"],
                    ["Tier 2", "$300 per covered location per month · 4,500 messages included · overage 6.7¢ per message", "Monthly in advance"],
                    ["Tier 3", "$400 per covered location per month · 7,000 messages included · overage 5.7¢ per message (5.7¢ above Tier 3; 12,000+ quoted separately)", "Monthly in advance"],
                    ["Multi-location discount (Section 3.8)", "10% off every location with 2 locations; 20% off every location with 3 or more", "Applied to each Monthly Fee"],
                    ["Term discount (Section 3.9)", "3-month: none · 6-month: $100 per location · 12-month: $200 per location", "Credit on the final invoice of the Initial Term"],
                    [
                      "Branded RCS sender (optional)",
                      "$500 one-time setup fee, plus $200 per year per brand",
                      "Setup fee on signature of the RCS addendum; annual fee on signature and each anniversary",
                    ],
                    [
                      "Additional location",
                      "Same plan and Initial Term end date as the first location unless the Order Form says otherwise; multi-location discount recalculated",
                      "Monthly in advance from the next billing date",
                    ],
                    ["Early termination fee (Section 12.3)", "$150 per covered location, flat, plus forfeiture of any uncredited term discount", "On the termination date"],
                  ].map(([item, amount, when]) => (
                    <tr key={item} className="border-t-2 border-black align-top">
                      <td className="px-3 py-2 text-black">{item}</td>
                      <td className="px-3 py-2">{amount}</td>
                      <td className="px-3 py-2">{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <P>
              A &ldquo;message&rdquo; is one text of up to 306 plain characters (134 when emoji or
              other non-GSM characters are used), about 25 of which carry the required opt-out line.
              Included messages reset monthly and do not roll over. Belan displays the estimated
              message count before every send. Multi-location pricing per location: Tier 1 $200 /
              $180 / $160, Tier 2 $300 / $270 / $240, Tier 3 $400 / $360 / $320 for one, two, and
              three or more locations.
            </P>
          </section>

          {/* Exhibit C */}
          <section>
            <H2 id="exhibit-c">Exhibit C: Messaging Compliance Standards</H2>
            <Clause n="C.1" title="Consent">
              A Contact may be texted only after giving prior express written consent to receive
              marketing texts from the Customer. Acceptable consent includes: the Customer&rsquo;s
              Belan sign-up page or QR flow; a referral flow where the friend enters their own number;
              a written or online form that names the Customer, states that marketing texts will be
              sent, says message and data rates may apply and that the person can reply STOP, and is
              affirmatively checked or signed by the person. Acceptable proof is the form, its
              timestamp and, for online forms, the IP address, or the Belan Consent Record.
            </Clause>
            <Clause n="C.2" title="Not acceptable">
              Numbers from delivery-app orders, purchased or rented lists, scraped websites, business
              cards without a written opt-in, &ldquo;everyone who has ever ordered,&rdquo; or verbal
              consent without a written record.
            </Clause>
            <Clause n="C.3" title="Required message elements">
              The Customer&rsquo;s name in the first message to a Contact and periodically
              thereafter; opt-out instructions at least monthly; no messages outside 8 AM to 9 PM in
              the Contact&rsquo;s local time unless the Contact initiated the conversation.
              Belan&rsquo;s templates include these elements; the Customer must not remove them.
            </Clause>
            <Clause n="C.4" title="Prohibited content">
              Content that carriers prohibit or restrict, including cannabis and CBD, illegal drugs,
              firearms, tobacco and vaping products, gambling, adult content, hate speech, high-risk
              financial offers, and anything deceptive. Alcohol may be referenced only where the
              Customer has age-gated its Contacts and the offer complies with state law; Belan
              recommends keeping prizes on food, merchandise and store credit.
            </Clause>
            <Clause n="C.5" title="Prizes and games">
              The Customer is responsible for ensuring that games of chance are free to enter, have
              clear rules, and comply with state sweepstakes and promotion law. Belan&rsquo;s games
              never require a purchase to play.
            </Clause>
            <Clause n="C.6" title="Belan's rights">
              Belan may reject, hold or stop any campaign that it reasonably believes violates this
              Exhibit or carrier rules, and will tell the Customer why.
            </Clause>
          </section>

          {/* Exhibit D */}
          <section>
            <H2 id="exhibit-d">Exhibit D: Point-of-Sale Access Authorization</H2>
            <Clause n="D.1" title="Authorization">
              The Customer authorizes Belan to connect to the point-of-sale account the Customer
              connects during onboarding, using credentials the Customer enters in the Services.
            </Clause>
            <Clause n="D.2" title="Scope (Clover)">
              Belan requests only: Customers (read), Orders (read), Inventory (read and write, used
              solely to create and remove coupon discounts), and Merchant (read). Belan does not
              change menus or prices, does not process payments, and does not issue refunds unless a
              separate written addendum authorizes a specific feature.
            </Clause>
            <Clause n="D.3" title="Storage">
              Credentials are stored in an encrypted secrets manager, are never displayed after entry,
              and are deleted when the Customer disconnects the point of sale or the Agreement ends.
            </Clause>
            <Clause n="D.4" title="Test discounts">
              Test sends may create a temporary discount in the point of sale that is removed
              automatically within minutes.
            </Clause>
            <Clause n="D.5" title="Other systems">
              For point-of-sale systems Belan adds later, the scope will be described in the Services
              at the time of connection and will be no broader than reasonably needed for coupons and
              order matching.
            </Clause>
          </section>

          {/* Contact */}
          <section>
            <H2 id="contact">Contact</H2>
            <div className="border-2 border-black p-6 space-y-2" style={{ background: "#a4e5f8" }}>
              <p className="font-black text-black">
                {COMPANY_NAME} d/b/a {DBA}
              </p>
              <p className="font-bold text-black/80">{CONTACT_ADDRESS}</p>
              <p className="font-bold text-black/80">
                Email: <Mail />
              </p>
              <p className="font-bold text-black/80">Phone: {CONTACT_PHONE}</p>
              <p className="font-bold text-black/80">
                Marketing AI Service Terms, version {VERSION}, effective {EFFECTIVE_DATE}.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-black px-4 sm:px-8 xl:px-16 py-6 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/BelanLogo.png"
              alt="Belan AI"
              width={28}
              height={28}
              className="w-7 h-7 rounded-full border-2 border-black object-cover"
            />
            <span className="font-black text-black text-xs tracking-widest">BELAN AI</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-black/50 tracking-widest">
            <Link href="/" className="hover:text-black transition-colors uppercase">Home</Link>
            <Link href="/privacy-policy" className="hover:text-black transition-colors uppercase">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-black transition-colors uppercase">Terms of Service</Link>
            <Link href="/marketing-terms" className="text-black uppercase">Marketing Terms</Link>
          </div>
          <p className="text-xs font-bold text-black/40 tracking-widest">
            © {new Date().getFullYear()} BELAN AI
          </p>
        </div>
      </footer>
    </main>
  );
}
