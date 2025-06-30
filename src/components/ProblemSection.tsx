
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Search, Users, TrendingDown } from 'lucide-react';

const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: Search,
      title: "Unsichtbar bei Google",
      description: "Ihre Gäste finden Sie nicht, weil Ihr Google Business Profil unvollständig oder veraltet ist.",
      example: "• Keine aktuellen Öffnungszeiten\n• Veraltete Speisekarte\n• Fehlende Fotos"
    },
    {
      icon: TrendingDown,
      title: "Sinkende Gästezahlen",
      description: "Die Konkurrenz ist online besser sichtbar und zieht Ihre potentiellen Gäste ab.",
      example: "• Konkurrenz erscheint vor Ihnen\n• Negative veraltete Bewertungen\n• Keine Online-Präsenz"
    },
    {
      icon: AlertTriangle,
      title: "Technische Überforderung",
      description: "Google Business, Social Media, Bewertungen - alles zu komplex und zeitaufwändig.",
      example: "• Zu viele verschiedene Plattformen\n• Keine Zeit für Updates\n• Technische Hürden"
    },
    {
      icon: Users,
      title: "Verpasste Chancen",
      description: "Jeden Tag gehen potentielle Gäste verloren, die Sie online nicht finden können.",
      example: "• Keine Online-Reservierungen\n• Verpasste Laufkundschaft\n• Umsatzeinbußen"
    }
  ];

  return (
    <section className="py-20 px-4 bg-red-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-6">
            Kennen Sie diese Probleme?
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Als Gastronom haben Sie genug um die Ohren. Digitales Marketing sollte nicht auch noch Kopfzerbrechen bereiten.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <Card key={index} className="bg-white border-red-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {problem.title}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {problem.description}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {problem.example}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
