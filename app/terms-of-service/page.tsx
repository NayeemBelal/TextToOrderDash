import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Belan AI",
  description:
    "Terms of Service for Belan AI restaurant automation software. $200/month subscription, 14-day free trial, month-to-month cancellation. Governed by Texas law.",
  alternates: {
    canonical: "https://belan.tech/terms-of-service",
  },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "May 12, 2026";
const COMPANY_NAME = "Yusra Institute LLC";
const DBA = "Belan AI";
const CONTACT_EMAIL = "nayeem@belan.tech";
const CONTACT_PHONE = "(203) 300-7233";
const CONTACT_ADDRESS = "Plano, TX";

export default function TermsOfServicePage() {
  return (
    <>
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
            Terms of Service
          </h1>
          <p className="text-sm font-bold text-black/50 mb-10">
            Effective Date: {EFFECTIVE_DATE} &nbsp;|&nbsp; {COMPANY_NAME} d/b/a {DBA}
          </p>

          {/* TOC */}
          <nav className="border-2 border-black p-6 mb-12 bg-gray-50">
            <p className="font-black text-xs uppercase tracking-widest mb-4">Table of Contents</p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm font-bold text-black/70">
              <li><a href="#acceptance" className="hover:text-black underline">Acceptance of Terms</a></li>
              <li><a href="#services" className="hover:text-black underline">Description of Services</a></li>
              <li><a href="#eligibility" className="hover:text-black underline">Eligibility</a></li>
              <li><a href="#accounts" className="hover:text-black underline">Accounts and Registration</a></li>
              <li><a href="#subscription" className="hover:text-black underline">Subscription, Billing, and Payment</a></li>
              <li><a href="#free-trial" className="hover:text-black underline">Free Trial</a></li>
              <li><a href="#cancellation" className="hover:text-black underline">Cancellation and Termination</a></li>
              <li><a href="#acceptable-use" className="hover:text-black underline">Acceptable Use</a></li>
              <li><a href="#intellectual-property" className="hover:text-black underline">Intellectual Property</a></li>
              <li><a href="#customer-data" className="hover:text-black underline">Customer Data and Privacy</a></li>
              <li><a href="#third-party" className="hover:text-black underline">Third-Party Services</a></li>
              <li><a href="#disclaimer" className="hover:text-black underline">Disclaimers</a></li>
              <li><a href="#liability" className="hover:text-black underline">Limitation of Liability</a></li>
              <li><a href="#indemnification" className="hover:text-black underline">Indemnification</a></li>
              <li><a href="#dispute" className="hover:text-black underline">Dispute Resolution and Governing Law</a></li>
              <li><a href="#changes" className="hover:text-black underline">Changes to These Terms</a></li>
              <li><a href="#contact" className="hover:text-black underline">Contact</a></li>
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-12 text-sm sm:text-base leading-relaxed">

            <section id="acceptance">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-black/80 font-bold mb-3">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement
                between you (&ldquo;Customer,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and{" "}
                {COMPANY_NAME} d/b/a {DBA} (&ldquo;{DBA},&rdquo; &ldquo;we,&rdquo;
                &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of the
                Belan AI platform and all associated services (the &ldquo;Services&rdquo;).
              </p>
              <p className="text-black/80 font-bold mb-3">
                By creating an account, starting a free trial, subscribing, or otherwise accessing
                the Services, you agree to be bound by these Terms and our{" "}
                <Link href="/privacy-policy" className="underline hover:text-black">
                  Privacy Policy
                </Link>
                , which is incorporated herein by reference.
              </p>
              <p className="text-black/80 font-bold">
                If you are accepting these Terms on behalf of a business entity, you represent and
                warrant that you have the authority to bind that entity to these Terms.
              </p>
            </section>

            <section id="services">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                2. Description of Services
              </h2>
              <p className="text-black/80 font-bold mb-4">
                Belan AI provides an AI-powered restaurant automation platform consisting of the
                following five products, all included in a single flat-rate subscription:
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Voice AI",
                    desc: "An AI phone agent that answers every incoming call to your restaurant 24/7, takes orders through natural conversation, upsells based on customer taste profiles, and sends completed orders directly to your POS system.",
                  },
                  {
                    name: "Text AI (SMS Ordering)",
                    desc: "A conversational AI that lets your customers order by texting a dedicated phone number — no app required. Manages order flow, payment links, and TCPA opt-in/opt-out compliance.",
                  },
                  {
                    name: "Dashboard",
                    desc: "Real-time analytics for restaurant operators: revenue, order volume, top-selling items, and call/text activity in a single command center.",
                  },
                  {
                    name: "Marketing AI",
                    desc: "An SMS marketing campaign tool that uses AI to draft and send targeted promotions to opted-in customers based on their order history and preferences.",
                  },
                  {
                    name: "Sales AI",
                    desc: "A natural-language interface for querying your restaurant&apos;s sales analytics. Ask plain-English questions about your data and get instant answers.",
                  },
                ].map(({ name, desc }) => (
                  <div key={name} className="border-2 border-black p-4">
                    <div className="font-black text-sm mb-1">{name}</div>
                    <p className="text-black/70 font-bold text-sm">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-black/60 font-bold mt-4 text-sm">
                We reserve the right to modify, add, or remove features of the Services with
                reasonable notice to you. Material reductions in core functionality will be communicated
                at least 30 days in advance.
              </p>
            </section>

            <section id="eligibility">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                3. Eligibility
              </h2>
              <p className="text-black/80 font-bold mb-3">
                The Services are intended for restaurant operators and food service businesses located
                in the United States. By using the Services, you represent that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2">
                <li>You are at least 18 years old.</li>
                <li>You are operating a lawfully licensed food service business.</li>
                <li>You have the authority to accept these Terms on behalf of your business.</li>
                <li>Your use of the Services complies with all applicable laws and regulations.</li>
              </ul>
            </section>

            <section id="accounts">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                4. Accounts and Registration
              </h2>
              <p className="text-black/80 font-bold mb-3">
                To access the Services, you must create an account by providing your business name,
                email address, and a password. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2 mb-3">
                <li>Maintaining the confidentiality of your login credentials.</li>
                <li>All activity that occurs under your account.</li>
                <li>
                  Notifying us immediately at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  if you become aware of any unauthorized access.
                </li>
              </ul>
              <p className="text-black/80 font-bold">
                We reserve the right to suspend or terminate accounts that violate these Terms or
                that we reasonably believe are being used fraudulently.
              </p>
            </section>

            <section id="subscription">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                5. Subscription, Billing, and Payment
              </h2>

              <h3 className="font-black text-base mb-2">5.1 Subscription Price</h3>
              <p className="text-black/80 font-bold mb-4">
                The Services are offered at <strong>$200.00 per month</strong> (the
                &ldquo;Subscription Fee&rdquo;), which includes all five products listed in Section 2.
                There are no per-order fees, per-call fees, or other usage-based charges.
              </p>

              <h3 className="font-black text-base mb-2">5.2 Billing Cycle</h3>
              <p className="text-black/80 font-bold mb-4">
                Your subscription is billed monthly. Your first billing date is the day after your
                14-day free trial ends (or the day you provide payment information and activate a
                paid subscription, whichever comes first). Subsequent charges occur on the same
                calendar day each month.
              </p>

              <h3 className="font-black text-base mb-2">5.3 Payment Methods</h3>
              <p className="text-black/80 font-bold mb-4">
                We accept payment by credit card via Stripe or by invoice. Credit card payments are
                processed securely by Stripe. By providing a credit card, you authorize us to charge
                the Subscription Fee to that card on each billing date. For invoice customers,
                payment is due within 30 days of invoice date.
              </p>

              <h3 className="font-black text-base mb-2">5.4 Failed Payments</h3>
              <p className="text-black/80 font-bold mb-4">
                If a payment fails, we will attempt to re-process the charge within 3 business days.
                If payment remains outstanding after 10 days, we may suspend your access to the
                Services until payment is received. If payment is not received within 30 days, we may
                terminate your account.
              </p>

              <h3 className="font-black text-base mb-2">5.5 Price Changes</h3>
              <p className="text-black/80 font-bold">
                We reserve the right to change the Subscription Fee upon at least 30 days&rsquo;
                written notice. Your continued use of the Services after the effective date of a
                price change constitutes acceptance of the new price.
              </p>
            </section>

            <section id="free-trial">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                6. Free Trial
              </h2>
              <p className="text-black/80 font-bold mb-3">
                New customers may access the Services free of charge for 14 days (the &ldquo;Free
                Trial&rdquo;). During the Free Trial, you have access to all features included in the
                standard subscription.
              </p>
              <p className="text-black/80 font-bold mb-3">
                At the end of the Free Trial, your account will automatically transition to a paid
                subscription unless you cancel before the trial period ends. You will not be charged
                during the Free Trial period.
              </p>
              <p className="text-black/80 font-bold">
                We reserve the right to modify, shorten, or discontinue the Free Trial offer at any
                time without prior notice. Only one Free Trial is permitted per business entity.
              </p>
            </section>

            <section id="cancellation">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                7. Cancellation and Termination
              </h2>

              <h3 className="font-black text-base mb-2">7.1 Cancellation by You</h3>
              <p className="text-black/80 font-bold mb-4">
                You may cancel your subscription at any time by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
                  {CONTACT_EMAIL}
                </a>
                . Cancellation takes effect at the end of your current billing period. You will
                retain access to the Services until that date. There is no minimum commitment period
                — subscriptions are month-to-month.
              </p>

              <h3 className="font-black text-base mb-2">7.2 No Refunds</h3>
              <p className="text-black/80 font-bold mb-4">
                All Subscription Fees are non-refundable. If you cancel mid-month, you will not
                receive a prorated refund for the unused portion of that billing period.
              </p>

              <h3 className="font-black text-base mb-2">7.3 Termination by Belan AI</h3>
              <p className="text-black/80 font-bold mb-4">
                We may suspend or terminate your account immediately if you: (a) violate these Terms;
                (b) fail to pay the Subscription Fee; (c) use the Services in a manner that violates
                applicable law; or (d) engage in conduct that we determine, in our sole discretion,
                is harmful to other customers, end-users, or the Services.
              </p>

              <h3 className="font-black text-base mb-2">7.4 Effect of Termination</h3>
              <p className="text-black/80 font-bold">
                Upon termination, your access to the Services will cease. You may request a copy of
                your restaurant&apos;s data within 30 days of termination by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
                  {CONTACT_EMAIL}
                </a>
                . After 30 days, we may delete your data in accordance with our{" "}
                <Link href="/privacy-policy" className="underline hover:text-black">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section id="acceptable-use">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                8. Acceptable Use
              </h2>
              <p className="text-black/80 font-bold mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2 mb-4">
                <li>Use the Services to send unsolicited commercial messages (spam) in violation of the TCPA or CAN-SPAM Act.</li>
                <li>Send SMS messages to customers who have opted out.</li>
                <li>Use the Services to process orders for illegal goods or services.</li>
                <li>Attempt to reverse-engineer, decompile, or derive source code from the Services.</li>
                <li>Resell, sublicense, or otherwise transfer access to the Services to third parties.</li>
                <li>Use the Services to collect or store payment card data in violation of PCI DSS standards.</li>
                <li>Interfere with or disrupt the integrity or performance of the Services.</li>
                <li>Access the Services using automated means not authorized by us.</li>
              </ul>
              <p className="text-black/80 font-bold">
                You are solely responsible for obtaining all necessary consents from your customers
                before sending SMS messages through the Services, including TCPA opt-in consent.
              </p>
            </section>

            <section id="intellectual-property">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                9. Intellectual Property
              </h2>

              <h3 className="font-black text-base mb-2">9.1 Our Property</h3>
              <p className="text-black/80 font-bold mb-4">
                All intellectual property rights in the Services — including the platform, AI models,
                software, interfaces, trademarks, and proprietary algorithms — are owned by or
                licensed to {COMPANY_NAME}. These Terms grant you a limited, non-exclusive,
                non-transferable, revocable license to use the Services solely for your restaurant
                business operations during the term of your subscription.
              </p>

              <h3 className="font-black text-base mb-2">9.2 Your Data</h3>
              <p className="text-black/80 font-bold mb-4">
                You retain ownership of all data you submit to the Services, including your
                restaurant&apos;s menu, customer order history, and business configuration
                (&ldquo;Customer Data&rdquo;). You grant us a limited license to use Customer Data
                solely to provide and improve the Services.
              </p>

              <h3 className="font-black text-base mb-2">9.3 Feedback</h3>
              <p className="text-black/80 font-bold">
                If you provide us with feedback, suggestions, or ideas about the Services, you grant
                us a perpetual, irrevocable, royalty-free license to use that feedback for any purpose.
              </p>
            </section>

            <section id="customer-data">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                10. Customer Data and Privacy
              </h2>
              <p className="text-black/80 font-bold mb-3">
                Our collection, use, and handling of data related to your customers (restaurant
                patrons) is governed by our{" "}
                <Link href="/privacy-policy" className="underline hover:text-black">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference.
              </p>
              <p className="text-black/80 font-bold mb-3">
                You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2 mb-3">
                <li>
                  You have obtained all legally required consents from your customers for us to
                  process their data on your behalf, including TCPA opt-in consent before any SMS
                  communication.
                </li>
                <li>
                  Your use of the Services and the Customer Data you provide does not violate any
                  applicable law or third-party rights.
                </li>
                <li>
                  You will comply with all applicable privacy laws, including the California Consumer
                  Privacy Act (CCPA) to the extent applicable to your business.
                </li>
              </ul>
              <p className="text-black/80 font-bold">
                We act as a service provider / data processor with respect to your customers&rsquo;
                personal information. We do not sell customer personal information to third parties.
              </p>
            </section>

            <section id="third-party">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                11. Third-Party Services
              </h2>
              <p className="text-black/80 font-bold mb-3">
                The Services integrate with third-party platforms including POS systems (Clover,
                Toast, Square), payment processors (Stripe, Clover), telephony providers (Telnyx,
                Twilio), and AI providers (OpenRouter, Ultravox AI). Your use of these integrations
                is subject to their respective terms of service and privacy policies.
              </p>
              <p className="text-black/80 font-bold mb-3">
                To use the POS integrations, you authorize us to connect to your POS account via
                OAuth. We store POS access and refresh tokens in encrypted form to maintain the
                integration.
              </p>
              <p className="text-black/80 font-bold">
                We are not responsible for the availability, accuracy, or conduct of any third-party
                service, and third-party service outages do not entitle you to refunds or service
                credits.
              </p>
            </section>

            <section id="disclaimer">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                12. Disclaimers
              </h2>
              <p className="text-black/80 font-bold mb-3 uppercase text-xs tracking-wide">
                THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p className="text-black/80 font-bold mb-3">
                We do not warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-black/80 font-bold ml-2 mb-3">
                <li>The Services will be uninterrupted, error-free, or available at all times.</li>
                <li>AI-generated order transcriptions or responses will be 100% accurate.</li>
                <li>The Services will meet your specific business requirements.</li>
                <li>Any errors in the Services will be corrected.</li>
              </ul>
              <p className="text-black/80 font-bold">
                We disclaim all warranties of merchantability, fitness for a particular purpose, and
                non-infringement to the fullest extent permitted by applicable law. We make no
                commitment to any specific uptime or service level availability.
              </p>
            </section>

            <section id="liability">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                13. Limitation of Liability
              </h2>
              <p className="text-black/80 font-bold mb-4 uppercase text-xs tracking-wide">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY_NAME},
                ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOST PROFITS,
                LOST REVENUE, LOST DATA, OR BUSINESS INTERRUPTION — ARISING OUT OF OR RELATED TO
                YOUR USE OF OR INABILITY TO USE THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE
                POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-black/80 font-bold">
                Our total aggregate liability to you for all claims arising out of or related to
                these Terms or the Services shall not exceed the total Subscription Fees you paid to
                us in the three (3) months immediately preceding the event giving rise to the claim.
              </p>
            </section>

            <section id="indemnification">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                14. Indemnification
              </h2>
              <p className="text-black/80 font-bold">
                You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers,
                directors, employees, and agents from and against any claims, liabilities, damages,
                judgments, and expenses (including reasonable attorneys&rsquo; fees) arising out of
                or related to: (a) your use of the Services in violation of these Terms; (b) your
                violation of any applicable law or regulation, including TCPA; (c) your customers&rsquo;
                claims arising from orders placed or not placed through the Services; or (d) any
                unauthorized access to your account due to your failure to protect your credentials.
              </p>
            </section>

            <section id="dispute">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                15. Dispute Resolution and Governing Law
              </h2>

              <h3 className="font-black text-base mb-2">15.1 Governing Law</h3>
              <p className="text-black/80 font-bold mb-4">
                These Terms and any disputes arising hereunder shall be governed by and construed in
                accordance with the laws of the State of Texas, without regard to its conflict of law
                principles.
              </p>

              <h3 className="font-black text-base mb-2">15.2 Informal Resolution</h3>
              <p className="text-black/80 font-bold mb-4">
                Before initiating any formal dispute proceeding, you agree to first contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
                  {CONTACT_EMAIL}
                </a>{" "}
                and give us 30 days to attempt to resolve the dispute informally.
              </p>

              <h3 className="font-black text-base mb-2">15.3 Binding Arbitration</h3>
              <p className="text-black/80 font-bold mb-4">
                If the dispute cannot be resolved informally, you and {COMPANY_NAME} agree to resolve
                it through final and binding arbitration administered by the American Arbitration
                Association (AAA) under its Commercial Arbitration Rules. The arbitration will be
                conducted in Plano, Texas, or remotely by mutual agreement. The arbitrator&rsquo;s
                award shall be final and binding and may be entered as a judgment in any court of
                competent jurisdiction.
              </p>

              <h3 className="font-black text-base mb-2">15.4 Class Action Waiver</h3>
              <p className="text-black/80 font-bold mb-4">
                You waive any right to participate in a class action lawsuit or class-wide arbitration
                against {COMPANY_NAME}. All disputes must be brought in your individual capacity only.
              </p>

              <h3 className="font-black text-base mb-2">15.5 Small Claims Court</h3>
              <p className="text-black/80 font-bold">
                Notwithstanding the above, either party may bring an individual claim in a small
                claims court of competent jurisdiction in Collin County, Texas, if the claim qualifies
                under that court&rsquo;s rules.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                16. Changes to These Terms
              </h2>
              <p className="text-black/80 font-bold mb-3">
                We may update these Terms from time to time. If we make material changes, we will
                post the updated Terms at{" "}
                <Link href="/terms-of-service" className="underline hover:text-black">
                  belan.tech/terms-of-service
                </Link>{" "}
                and notify you by email at least 30 days before the changes take effect.
              </p>
              <p className="text-black/80 font-bold">
                Your continued use of the Services after the effective date of any changes
                constitutes your acceptance of the updated Terms. If you do not agree to the updated
                Terms, you must cancel your subscription before the effective date.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-xl sm:text-2xl font-black text-black mb-4 border-b-2 border-black pb-2">
                17. Contact
              </h2>
              <p className="text-black/80 font-bold mb-4">
                Questions about these Terms? Contact us:
              </p>
              <div className="border-2 border-black p-6 space-y-2" style={{ background: "#a4e5f8" }}>
                <p className="font-black text-black">{COMPANY_NAME} d/b/a {DBA}</p>
                <p className="font-bold text-black/80">{CONTACT_ADDRESS}</p>
                <p className="font-bold text-black/80">
                  Email:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                <p className="font-bold text-black/80">Phone: {CONTACT_PHONE}</p>
                <p className="font-bold text-black/80">
                  Website:{" "}
                  <a
                    href="https://belan.tech"
                    className="underline hover:text-black"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    belan.tech
                  </a>
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
              <Link href="/about" className="hover:text-black transition-colors uppercase">About</Link>
              <Link href="/privacy-policy" className="hover:text-black transition-colors uppercase">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-black uppercase">Terms of Service</Link>
            </div>
            <p className="text-xs font-bold text-black/40 tracking-widest">
              © {new Date().getFullYear()} BELAN AI
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
