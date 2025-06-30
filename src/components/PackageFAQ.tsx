
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const PackageFAQ: React.FC = () => {
  const { t } = useTranslation();

  const faqItems = [
    {
      question: 'Wie oft werden meine Daten wirklich aktualisiert?',
      answer: 'Bei der Profilpflege Basis kontrollieren wir Ihre Daten monatlich systematisch: Öffnungszeiten, Kontaktdaten und saisonale Anpassungen jeweils 1x pro Monat. Menü-Updates erfolgen wöchentlich (4x monatlich). Sie erhalten einen detaillierten monatlichen Bericht über alle durchgeführten Änderungen.'
    },
    {
      question: 'Was bedeutet "Mindestlaufzeit 6 Monate"?',
      answer: 'Die Mindestlaufzeit stellt sicher, dass wir nachhaltigen Erfolg für Ihr Business aufbauen können. Google und Social Media Algorithmen benötigen Zeit, um Vertrauen zu Ihrem Profil aufzubauen. Nach 6 Monaten können Sie monatlich kündigen.'
    },
    {
      question: 'Brauche ich einen Google Business Account für Social Media Management?',
      answer: 'Ja, ein aktiver Google Business Account ist Voraussetzung für unser Social Media Management. Nur so können wir die SEO-Verknüpfung herstellen und sicherstellen, dass Ihre Social Media Posts auch Ihre lokale Sichtbarkeit bei Google verbessern.'
    },
    {
      question: 'Wie funktioniert das Mitarbeiter-Freigabe-System?',
      answer: 'Ihre Mitarbeiter erhalten einen kontrollierten Zugang, über den sie Fotos und Texte hochladen können. Alle Posts werden Ihnen zur Freigabe vorgelegt - erst nach Ihrer Genehmigung werden sie veröffentlicht. Sie behalten die volle Kontrolle über Ihre Markendarstellung.'
    },
    {
      question: 'Was ist im Social Media Kanal Setup enthalten?',
      answer: 'Das Setup umfasst die professionelle Einrichtung Ihres Instagram oder Facebook Kanals: Profil-Optimierung, CI-konforme Gestaltung, erste Content-Strategie, Verknüpfung mit Ihrem Google Business Profil und Analytics-Setup für die Erfolgsmessung.'
    },
    {
      question: 'Kann ich Pakete später upgraden oder downgraden?',
      answer: 'Ja, Sie können jederzeit upgraden. Ein Downgrade ist zum Ende der Mindestlaufzeit möglich. Beim Premium Paket erhalten Sie bereits alle Leistungen für 6 Monate - ein späteres Upgrade auf einzelne Services ist dann nicht mehr nötig.'
    },
    {
      question: 'Wie schnell sehe ich erste Ergebnisse?',
      answer: 'Erste Verbesserungen in der Online-Sichtbarkeit sehen Sie meist innerhalb von 2-4 Wochen. Signifikante Steigerungen bei Anfragen und Reservierungen zeigen sich typischerweise nach 6-8 Wochen kontinuierlicher Optimierung.'
    },
    {
      question: 'Was passiert, wenn ich kündige?',
      answer: 'Ihre Google Business Profile und Social Media Kanäle bleiben natürlich Ihr Eigentum. Sie erhalten alle Zugangsdaten und eine Übergabe-Dokumentation. Nur die laufende Betreuung und Optimierung durch uns endet.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            Häufige Fragen
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Klarheit für bessere Entscheidungen - keine versteckten Überraschungen
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-4 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Haben Sie weitere Fragen? Wir beraten Sie gerne persönlich.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+4989123456789" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Jetzt anrufen
            </a>
            <a 
              href="mailto:mail@matbakh.app" 
              className="border border-black text-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              E-Mail senden
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackageFAQ;
