
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Zap, TrendingUp, Clock } from 'lucide-react';

const SolutionSection: React.FC = () => {
  const solutions = [
    {
      icon: Zap,
      title: "Automatische Google-Optimierung",
      description: "Wir übernehmen die komplette Einrichtung und Pflege Ihres Google Business Profils.",
      benefits: "• Professionelle Einrichtung\n• Regelmäßige Updates\n• Optimierte Sichtbarkeit"
    },
    {
      icon: TrendingUp,
      title: "Mehr Sichtbarkeit = Mehr Gäste",
      description: "Durch optimierte Online-Präsenz werden Sie von mehr potentiellen Gästen gefunden.",
      benefits: "• Höheres Google-Ranking\n• Mehr Online-Anfragen\n• Steigende Reservierungen"
    },
    {
      icon: Clock,
      title: "Zeit sparen, Fokus aufs Wesentliche",
      description: "Sie kümmern sich um Ihre Gäste, wir um Ihre Online-Sichtbarkeit.",
      benefits: "• Keine technischen Sorgen\n• Mehr Zeit für Ihr Restaurant\n• Professionelle Betreuung"
    },
    {
      icon: CheckCircle,
      title: "Messbare Erfolge",
      description: "Sehen Sie in Echtzeit, wie sich Ihre Online-Sichtbarkeit verbessert.",
      benefits: "• Detaillierte Analytics\n• Monatliche Reports\n• Transparente Ergebnisse"
    }
  ];

  return (
    <section className="py-20 px-4 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-6">
            So lösen wir Ihre Probleme
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Sie müssen sich nicht um komplexe technische Anforderungen kümmern, wir erledigen das für Sie.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => {
            const IconComponent = solution.icon;
            return (
              <Card key={index} className="bg-white border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-3">
                        {solution.title}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {solution.description}
                      </p>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-green-800 whitespace-pre-line font-medium">
                          {solution.benefits}
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

export default SolutionSection;
