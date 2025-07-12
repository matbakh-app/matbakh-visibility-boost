
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LogoSection from '@/components/LogoSection';

const Privacy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - matbakh.app</title>
        <meta name="description" content="Privacy Policy of matbakh.app – comprehensive information about data processing, Google integration and data subject rights." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://matbakh.app/privacy" />
      </Helmet>
      
      <div className="py-8">
        <LogoSection />
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none space-y-8 text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-500">Status: July 2025</p>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">1. Data Controller</h2>
              <p>matbakh.app<br/>
              Managing Director: Rabieb Al Khatib<br/>
              E-Mail: mail(at)matbakh(dot)app<br/>
              Ridlerstraße 29F, 80339 München</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">2. General Information on Data Processing</h2>
              <p>We take the protection of your personal data very seriously. Your data will only be processed in accordance with statutory regulations (GDPR, TMG). Below, we provide comprehensive information about how your data is processed on matbakh.app.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">3. Purposes and Legal Bases for Processing</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-black">a) Website Hosting and Provision (Supabase)</h3>
              <p>Our website, databases, and media are hosted on Supabase (EU servers, location: Frankfurt, Germany).</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(f) GDPR (legitimate interest in secure, high-performance hosting)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">b) User Account, Authentication & Business Profile</h3>
              <p>You can create a user account via e-mail or Google login.</p>
              <p><strong>Data collected:</strong> name, e-mail, company, Google account details (if used)</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR (performance of contract), Art. 6(1)(a) GDPR (consent)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">c) Google Integration (Google My Business, OAuth, Analytics)</h3>
              <p>If you connect your Google account, we store necessary tokens and profile information to provide the integration.</p>
              <p><strong>Used Google APIs:</strong> OAuth, Google Business Profile (My Business), Google Analytics 4</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR (contract), Art. 6(1)(a) GDPR (consent for analytics)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">d) Payment Processing (Stripe)</h3>
              <p>For paid services, payment processing is handled by Stripe Payments Europe, Ltd.</p>
              <p><strong>Data:</strong> name, e-mail, billing address, payment details</p>
              <p>Stripe stores payment data independently.</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR (contract), Art. 6(1)(f) GDPR (secure payment processing)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">e) E-Mail Communication & Notifications (Resend)</h3>
              <p>We send system e-mails (e.g., confirmation, notifications) via Resend.com.</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">f) Cookies & Consent</h3>
              <p>We use necessary cookies and, with your consent, analytics/tracking cookies.</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(a) GDPR (consent), Art. 6(1)(f) GDPR (operation)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">g) Support, Monitoring & Error Analysis</h3>
              <p>We log errors and collect usage statistics for quality assurance (Supabase, Monitoring, Analytics).</p>
              <p><strong>Legal basis:</strong> Art. 6(1)(f) GDPR</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">4. Data Transfer to Third Parties and Third Countries</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Supabase:</strong> Hosting/storage in the EU (Frankfurt, Germany); no transfer outside the EU.</li>
                <li><strong>Stripe:</strong> Transfer of payment data to Stripe (EU); depending on transaction, data may be transferred to the USA (Standard Contractual Clauses).</li>
                <li><strong>Google:</strong> When using Google integration and analytics, data is transferred to Google Ireland Ltd. and, if applicable, Google LLC (USA) (Standard Contractual Clauses).</li>
                <li><strong>Resend:</strong> E-mail sent via Resend, servers located in the USA; protected by Standard Contractual Clauses.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">5. Storage Duration</h2>
              <p>Personal data is stored as long as necessary to fulfill contracts, support, compliance, or statutory retention.</p>
              <p>After the purpose has expired or at your request, data will be deleted unless statutory retention periods apply.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Access (Art. 15 GDPR)</li>
                <li>Rectification (Art. 16 GDPR)</li>
                <li>Erasure ("Right to be forgotten", Art. 17 GDPR)</li>
                <li>Restriction of processing (Art. 18 GDPR)</li>
                <li>Object to processing (Art. 21 GDPR)</li>
                <li>Data portability (Art. 20 GDPR)</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="mt-4">You may exercise your rights at any time by contacting mail(at)matbakh(dot)app.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">7. Right of Withdrawal (Consent)</h2>
              <p>You may withdraw any consent given at any time, effective for the future.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">8. Provision Requirement</h2>
              <p>You are not obliged to provide personal data. However, some services (e.g., e-mail registration) cannot be used without certain data.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">9. Updates to this Privacy Policy</h2>
              <p>This privacy policy is regularly updated to reflect new legal or technical requirements.</p>
              <p className="text-sm text-gray-500 mt-4">Status: July 2025</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
