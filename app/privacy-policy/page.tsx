import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Belan AI",
  description:
    "Belan AI Privacy Policy — how we collect, use, and protect data for restaurant patrons and restaurant operators using our AI ordering platform.",
  alternates: {
    canonical: "https://belan.tech/privacy-policy",
  },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "May 12, 2026";
const COMPANY = "Yusra Institute LLC";
const DBA = "Belan AI";
const EMAIL = "nayeem@belan.tech";
const PHONE = "(203) 300-7233";
const ADDRESS = "Plano, TX";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b-2 border-black py-10 scroll-mt-20">
      <h2 className="text-xl sm:text-2xl font-black text-black mb-5">{title}</h2>
      <div className="space-y-4 text-sm sm:text-base text-black/70 font-bold leading-relaxed">
        {children}
      </div>
    </section>
  );
}

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "who-we-are", label: "Who We Are" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Information" },
  { id: "third-party-sharing", label: "Third-Party Sharing" },
  { id: "tcpa-sms", label: "SMS / TCPA Consent" },
  { id: "payment", label: "Payment Processing" },
  { id: "data-retention", label: "Data Retention" },
  { id: "security", label: "Security" },
  { id: "your-rights", label: "Your Rights (CCPA)" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white min-h-screen font-tektur">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-black px-4 sm:px-8 xl:px-16 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BelanLogo.png" alt="Belan AI" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-black object-cover" />
          <span className="font-black text-black text-sm tracking-widest">BELAN AI</span>
        </Link>
        <Link href="/" className="text-xs font-bold text-black/60 hover:text-black tracking-widest uppercase">← Home</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="border-b-2 border-black pb-10 mb-0">
          <div className="inline-block border-2 border-black px-3 py-1.5 text-xs font-bold mb-4 tracking-widest" style={{ background: "#a4e5f8" }}>
            LEGAL
          </div>
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-black mb-3">Privacy Policy</h1>
          <p className="text-sm font-bold text-black/50">Effective Date: {EFFECTIVE_DATE}</p>
          <p className="text-sm font-bold text-black/50 mt-1">
            Operated by {COMPANY} d/b/a {DBA} &mdash; {ADDRESS}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="border-b-2 border-black py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4">Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {TOC.map(({ id, label }, i) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-sm font-bold text-black hover:underline"
              >
                {i + 1}. {label}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <Section id="overview" title="1. Overview">
          <p>
            {DBA} (&ldquo;Belan AI,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is operated by {COMPANY}, headquartered in {ADDRESS}. We provide an AI-powered phone and SMS ordering platform for restaurants, including Voice AI, Text AI, Dashboard Analytics, Marketing AI, and Sales AI (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and protect information about (a) <strong>restaurant patrons</strong> who interact with our AI through phone calls or text messages, and (b) <strong>restaurant operators</strong> who subscribe to and configure the Service.
          </p>
          <p>
            By using the Service — whether as a patron ordering food or as a restaurant operator — you agree to the practices described in this policy. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section id="who-we-are" title="2. Who We Are">
          <p>
            <strong>{COMPANY}</strong> operates as <strong>{DBA}</strong>, a restaurant technology company founded in 2025 and headquartered in Plano, Texas. We build AI systems that handle phone calls and SMS conversations on behalf of restaurants, enabling automated ordering without requiring customers to download an app.
          </p>
          <p>
            For privacy inquiries, contact us at <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a> or {PHONE}.
          </p>
        </Section>

        <Section id="information-we-collect" title="3. Information We Collect">
          <p><strong>3.1 From Restaurant Patrons (customers who call or text a restaurant)</strong></p>
          <ul className="list-none space-y-2 pl-0">
            {[
              ["Phone number", "Collected automatically from every inbound call or text. Stored as the primary identifier for your profile."],
              ["Name", "Collected during conversation if you provide it. Optional, but used to personalize your experience."],
              ["Email address", "Collected via SMS only, optionally, for payment confirmation. Not required to place an order."],
              ["Conversation history", "Every SMS message and voice call transcript is recorded and stored. This includes everything you say or type during an ordering session."],
              ["Order history", "Every order you place — items, quantities, modifiers, prices, timestamps — is stored permanently."],
              ["Taste profile", "Our AI extracts preferences from your conversation history: foods you like, foods you dislike, allergens you have mentioned, and dietary restrictions you have expressed. This profile is updated over time and used to personalize recommendations."],
              ["Dietary and allergy information", "Any allergy or dietary restriction you mention during a call or text is recorded and stored as part of your taste profile."],
              ["Card last 4 digits and card brand", "Stored after a successful payment for display purposes only. Full card numbers are never stored on our servers."],
              ["Call metadata", "Call duration, call outcome (e.g., order placed, call transferred), and timestamps are recorded for each call."],
              ["TCPA consent status", "Your opt-in and opt-out history for SMS communications with each restaurant is stored."],
            ].map(([term, def]) => (
              <li key={term as string} className="border-2 border-black p-3">
                <span className="text-black font-black">{term}: </span>
                <span>{def}</span>
              </li>
            ))}
          </ul>

          <p className="pt-2"><strong>3.2 From Restaurant Operators (business subscribers)</strong></p>
          <ul className="list-none space-y-2 pl-0">
            {[
              ["Account credentials", "Email address and hashed password stored via Supabase Authentication."],
              ["Restaurant information", "Restaurant name, phone number, business hours, tax rate, and physical address."],
              ["POS integration credentials", "OAuth access and refresh tokens for Clover POS, stored encrypted. Automatically refreshed before expiry."],
              ["AI configuration", "Custom AI greeting text, voice ID selection, forwarding phone number, FAQ content, and upsell rules — all stored per restaurant."],
            ].map(([term, def]) => (
              <li key={term as string} className="border-2 border-black p-3">
                <span className="text-black font-black">{term}: </span>
                <span>{def}</span>
              </li>
            ))}
          </ul>

          <p className="pt-2"><strong>3.3 Information We Do Not Collect</strong></p>
          <p>
            We do not store full credit card numbers, CVV codes, or card expiration dates on our servers. All payment card data is tokenized by Stripe or Clover before reaching us. We are PCI DSS SAQ A compliant.
          </p>
        </Section>

        <Section id="how-we-use" title="4. How We Use Information">
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-none space-y-2 pl-0">
            {[
              ["Order processing", "To receive your order, confirm items and modifiers, calculate pricing, process payment, and deliver the completed order to the restaurant's POS system."],
              ["Personalization", "To greet you by name on return visits and surface your taste profile (likes, dislikes, allergies) to our AI so it can make relevant suggestions and flag potential allergy conflicts."],
              ["SMS marketing", "To send promotional text messages on behalf of the restaurant, but only if you have affirmatively opted in and only while you remain opted in. You can opt out at any time by texting STOP."],
              ["Analytics and reporting", "To provide restaurant operators with aggregated analytics: total revenue, order volume, top-selling items, and customer trends. Individual patron identities are not surfaced in operator-facing analytics."],
              ["Service improvement", "To train and improve our AI models, monitor service quality, and debug issues. Conversation data used for training is processed by third-party AI providers under data processing agreements."],
              ["Security and fraud prevention", "To detect, investigate, and prevent unauthorized access, fraud, and abuse."],
              ["Legal compliance", "To comply with applicable law, respond to legal process, and enforce our Terms of Service."],
            ].map(([term, def]) => (
              <li key={term as string} className="border-2 border-black p-3">
                <span className="text-black font-black">{term}: </span>
                <span>{def}</span>
              </li>
            ))}
          </ul>
          <p>
            We do not sell your personal information to third parties. We do not use your information for advertising on other platforms.
          </p>
        </Section>

        <Section id="third-party-sharing" title="5. Third-Party Service Providers">
          <p>
            We share information with the following third-party service providers solely to operate the Service. Each provider is bound by data processing terms:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-black border-collapse">
              <thead>
                <tr style={{ background: "#a4e5f8" }}>
                  <th className="border-2 border-black px-3 py-2 text-left font-black">Provider</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-black">Purpose</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-black">Data Shared</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", "Database & authentication", "All customer and operator data"],
                  ["Ultravox AI", "Voice call AI engine", "Call audio, transcripts, taste profiles, system prompts"],
                  ["OpenRouter", "LLM gateway (SMS AI)", "Conversation history, menu data, taste profiles, cart state"],
                  ["Telnyx", "Phone calls and SMS delivery", "Phone numbers, call audio streams, message content"],
                  ["Twilio", "SMS delivery (alternative)", "Phone numbers, message content"],
                  ["Clover (Fiserv)", "POS integration & payments", "Order details, OAuth tokens, menu data"],
                  ["Stripe", "Payment processing (Voice AI)", "Order line items, customer phone number"],
                  ["Toast", "POS integration (future)", "Order details, menu data"],
                  ["Square", "POS integration (future)", "Order details, menu data"],
                  ["Google Cloud", "Backend hosting & secrets", "Server logs; API credentials (not patron data)"],
                ].map(([provider, purpose, data]) => (
                  <tr key={provider as string} className="border-b-2 border-black">
                    <td className="border-2 border-black px-3 py-2 font-black text-black">{provider}</td>
                    <td className="border-2 border-black px-3 py-2">{purpose}</td>
                    <td className="border-2 border-black px-3 py-2">{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We may also disclose information when required by law, court order, or government request; to protect the rights, property, or safety of {DBA}, our users, or the public; or in connection with a business transfer such as a merger or acquisition (with advance notice to users).
          </p>
        </Section>

        <Section id="tcpa-sms" title="6. SMS Communications and TCPA Consent">
          <p>
            When you text a restaurant that uses Belan AI, you will receive the following consent message before your first conversation begins:
          </p>
          <blockquote className="border-l-4 border-black pl-4 py-2 my-4 bg-gray-50">
            <p className="font-black text-black">
              Reply YES to order by text. Msg freq varies. Msg&amp;Data Rates May Apply. STOP=opt out, HELP=help. Privacy: https://belan.tech/privacy-policy
            </p>
          </blockquote>
          <p>
            Your consent is specific to each restaurant. Opting in to receive texts from one restaurant does not opt you in to receive texts from any other restaurant on the Belan AI platform.
          </p>
          <ul className="list-none space-y-1 pl-0">
            {[
              "Text STOP at any time to immediately opt out of all messages from that restaurant.",
              "Text START to re-enable text ordering after opting out.",
              "Text HELP for support information.",
              "Marketing SMS messages are only sent to customers who have an active opt-in status.",
              "We do not send marketing messages to customers who have texted STOP.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="payment" title="7. Payment Processing">
          <p>
            Payment for orders placed through Belan AI is handled by <strong>Stripe</strong> (for Voice AI orders) or <strong>Clover</strong> (for SMS orders). Both providers are PCI DSS compliant and handle all card tokenization.
          </p>
          <p>
            Belan AI does not store full card numbers, CVV codes, or expiration dates on our servers. We store only the last 4 digits of your card and the card brand (e.g., Visa, Mastercard) for display purposes after a successful transaction.
          </p>
          <p>
            Our PCI DSS compliance level is SAQ A, which applies to merchants that have fully delegated all cardholder data functions to PCI DSS compliant third parties.
          </p>
        </Section>

        <Section id="data-retention" title="8. Data Retention">
          <p>We retain your information for as long as it is needed to provide the Service or as required by law:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-black border-collapse">
              <thead>
                <tr style={{ background: "#a4e5f8" }}>
                  <th className="border-2 border-black px-3 py-2 text-left font-black">Data Type</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-black">Retention Period</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["SMS conversation history", "Indefinite; archival to cold storage planned after 90 days"],
                  ["Voice call transcripts", "Indefinite"],
                  ["Order history", "Indefinite"],
                  ["Taste profiles", "Indefinite; preference signals older than ~6 months are weighted less heavily"],
                  ["TCPA consent records", "Indefinite (required for regulatory compliance)"],
                  ["Payment sessions", "15 minutes (automatically deleted)"],
                  ["Restaurant operator accounts", "Until account deletion is requested"],
                ].map(([type, period]) => (
                  <tr key={type as string} className="border-b-2 border-black">
                    <td className="border-2 border-black px-3 py-2 font-black text-black">{type}</td>
                    <td className="border-2 border-black px-3 py-2">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            You may request deletion of your personal data at any time by emailing{" "}
            <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a>. We will process verified deletion requests within 45 days.
          </p>
        </Section>

        <Section id="security" title="9. Security">
          <p>We implement the following measures to protect your information:</p>
          <ul className="list-none space-y-1 pl-0">
            {[
              "Encryption at rest: All data stored in Supabase (PostgreSQL) is encrypted at rest.",
              "Encryption in transit: All data transmitted over the network uses HTTPS/TLS 1.2 or higher. Voice call audio is encrypted via RTP.",
              "Multi-tenant isolation: Row-Level Security (RLS) ensures that each restaurant can only access its own customer data.",
              "Credential management: API keys and secrets are stored in Google Cloud Secret Manager in production. No credentials are hardcoded in source code.",
              "Payment security: Webhook payloads from Stripe are verified using HMAC SHA-256 signature validation.",
              "Access controls: Access to production systems is limited to authorized personnel only.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            <strong>Security incident response:</strong> In the event of a data breach that affects your personal information, we will notify affected users within 72 hours of discovering the breach (where feasible), provide details of the information involved and the steps we are taking, and advise on steps you can take to protect yourself. We will also notify applicable regulatory authorities as required by law.
          </p>
          <p>
            No method of transmission over the internet or electronic storage is 100% secure. While we use commercially reasonable security measures, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section id="your-rights" title="10. Your Rights — California Residents (CCPA)">
          <p>
            If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-none space-y-2 pl-0">
            {[
              ["Right to Know", "You have the right to request information about the categories and specific pieces of personal information we have collected about you, the sources of that information, the purposes for which it is used, and the categories of third parties with whom it is shared."],
              ["Right to Delete", "You have the right to request deletion of your personal information. We will honor verified deletion requests within 45 days, subject to exceptions required by law (e.g., we may retain records required for fraud prevention or legal compliance)."],
              ["Right to Opt Out of Sale", "We do not sell personal information. There is nothing to opt out of."],
              ["Right to Non-Discrimination", "We will not discriminate against you for exercising any of your CCPA rights. We will not deny you services, charge you different prices, or provide you a different level of service because you exercised a privacy right."],
            ].map(([title, desc]) => (
              <li key={title as string} className="border-2 border-black p-3">
                <span className="text-black font-black">{title}: </span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a> with the subject line &ldquo;Privacy Request.&rdquo; We may ask you to verify your identity before processing your request.
          </p>
          <p>
            These rights also apply in substance to residents of other US states with similar consumer privacy laws. We will process requests from all US residents in good faith.
          </p>
        </Section>

        <Section id="children" title="11. Children's Privacy">
          <p>
            The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected information from a child under 13, please contact us at{" "}
            <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a> and we will delete it promptly.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on this page and update the effective date. We will provide at least 30 days&rsquo; advance notice of material changes by posting a notice on our website at{" "}
            <a href="https://belan.tech" className="underline">belan.tech</a>.
          </p>
          <p>
            Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section id="contact" title="13. Contact Us">
          <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
          <div className="border-2 border-black p-6 mt-4 inline-block">
            <p className="font-black text-black text-base">{COMPANY} d/b/a {DBA}</p>
            <p>{ADDRESS}</p>
            <p>
              Email:{" "}
              <a href={`mailto:${EMAIL}`} className="underline">{EMAIL}</a>
            </p>
            <p>Phone: {PHONE}</p>
            <p>
              Website:{" "}
              <a href="https://belan.tech" className="underline">https://belan.tech</a>
            </p>
          </div>
        </Section>

        {/* Footer links */}
        <div className="pt-10 flex flex-wrap gap-4 text-xs font-bold text-black/50 tracking-widest">
          <Link href="/" className="hover:text-black uppercase">Home</Link>
          <Link href="/about" className="hover:text-black uppercase">About</Link>
          <Link href="/terms-of-service" className="hover:text-black uppercase">Terms of Service</Link>
          <span className="text-black uppercase">Privacy Policy</span>
        </div>
      </div>
    </main>
  );
}
