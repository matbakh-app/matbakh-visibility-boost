
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LogoSection from '@/components/LogoSection';

const Datenschutz: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Datenschutz - matbakh.app</title>
        <meta name="description" content="Datenschutzerklärung der matbakh.app – alle Informationen zur Datenverarbeitung, Google Integration und Betroffenenrechten." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://matbakh.app/datenschutz" />
      </Helmet>
      
      <div className="py-8">
        <LogoSection />
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
          
          <div className="prose max-w-none space-y-8 text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-500">Stand: Juli 2025</p>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">1. Verantwortlicher</h2>
              <p>matbakh.app<br/>
              Geschäftsführer: Rabieb Al Khatib<br/>
              E-Mail: mail(at)matbakh(dot)app<br/>
              Ridlerstraße 29F, 80339 München</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">2. Allgemeine Hinweise zur Datenverarbeitung</h2>
              <p>Wir nehmen den Schutz Ihrer personenbezogenen Daten sehr ernst. Wir verarbeiten Ihre Daten ausschließlich im Rahmen der gesetzlichen Vorschriften (DSGVO, TMG). Nachfolgend informieren wir Sie umfassend über die Verarbeitung Ihrer Daten auf matbakh.app.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">3. Zwecke und Rechtsgrundlagen der Datenverarbeitung</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-black">a) Bereitstellung der Website und Hosting (Supabase)</h3>
              <p>Wir hosten unsere Website, Datenbanken und Medien auf Supabase (EU-Server, Standort: Frankfurt/Main, Deutschland).</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem, performanten Hosting)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">b) Nutzerkonto, Authentifizierung & Business-Profil</h3>
              <p>Sie können ein Nutzerkonto per E-Mail oder Google-Login anlegen.</p>
              <p><strong>Erhobene Daten:</strong> Name, E-Mail, Unternehmen, ggf. Google-Account-Daten</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. a DSGVO (bei expliziter Einwilligung)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">c) Google-Integration (Google My Business, OAuth, Analytics)</h3>
              <p>Wenn Sie Ihr Google-Konto verbinden, speichern wir die zur Integration notwendigen Tokens und Profilinformationen.</p>
              <p><strong>Verwendete Google-APIs:</strong> OAuth, Google Business Profile (My Business), Google Analytics 4</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Analytics)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">d) Zahlungsabwicklung (Stripe)</h3>
              <p>Bei kostenpflichtigen Leistungen erfolgt die Zahlungsabwicklung über Stripe Payments Europe, Ltd.</p>
              <p><strong>Daten:</strong> Name, E-Mail, Rechnungsadresse, Zahlungsinformationen</p>
              <p>Stripe speichert Zahlungsdaten eigenverantwortlich.</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertrag), Art. 6 Abs. 1 lit. f DSGVO (sichere Zahlungsabwicklung)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">e) E-Mail-Kommunikation & Notifications (Resend)</h3>
              <p>Wir versenden Systemmails (z.B. Bestätigung, Benachrichtigungen) über den Dienst Resend.com.</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">f) Cookies & Consent</h3>
              <p>Wir verwenden notwendige Cookies und, mit Ihrer Einwilligung, Analyse-/Tracking-Cookies.</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), Art. 6 Abs. 1 lit. f DSGVO (Betrieb)</p>
              
              <h3 className="text-xl font-semibold mb-3 text-black">g) Support, Monitoring & Fehleranalyse</h3>
              <p>Wir erfassen Fehler-Logs und Nutzungsstatistiken zur Qualitätssicherung (Supabase, Monitoring, Analytics).</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">4. Übermittlung von Daten an Dritte und in Drittländer</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Supabase:</strong> Hosting/Storage in der EU (Frankfurt/Main), keine Übermittlung außerhalb EU.</li>
                <li><strong>Stripe:</strong> Übermittlung von Zahlungsdaten an Stripe (EU); je nach Vorgang evtl. Übertragung in die USA (Standardvertragsklauseln).</li>
                <li><strong>Google:</strong> Bei Nutzung der Google-Integration und Analytics werden Daten an Google Ireland Ltd. und ggf. Google LLC (USA) übertragen (Standardvertragsklauseln).</li>
                <li><strong>Resend:</strong> E-Mail-Versand über Resend, Serverstandort USA; Schutz durch Standardvertragsklauseln.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">5. Speicherdauer</h2>
              <p>Personenbezogene Daten werden so lange gespeichert, wie sie für die Vertragserfüllung, Support, Nachweispflichten oder gesetzliche Aufbewahrung erforderlich sind.</p>
              <p>Nach Wegfall des Zwecks bzw. auf Ihren Wunsch werden Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">6. Ihre Rechte als betroffene Person</h2>
              <p>Sie haben das Recht auf:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Auskunft (Art. 15 DSGVO)</li>
                <li>Berichtigung (Art. 16 DSGVO)</li>
                <li>Löschung („Recht auf Vergessenwerden", Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
              </ul>
              <p className="mt-4">Sie können Ihre Rechte jederzeit per E-Mail an mail(at)matbakh(dot)app geltend machen.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">7. Widerrufsrecht bei Einwilligung</h2>
              <p>Sie können eine erteilte Einwilligung zur Datenverarbeitung jederzeit mit Wirkung für die Zukunft widerrufen.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">8. Pflicht zur Bereitstellung</h2>
              <p>Sie sind nicht verpflichtet, personenbezogene Daten bereitzustellen. Ohne einige Daten (z.B. E-Mail) ist jedoch die Nutzung der Services nicht möglich.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-black">9. Aktualisierung dieser Datenschutzerklärung</h2>
              <p>Diese Datenschutzerklärung wird regelmäßig an neue rechtliche und technische Anforderungen angepasst.</p>
              <p className="text-sm text-gray-500 mt-4">Stand: Juli 2025</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Datenschutz;
