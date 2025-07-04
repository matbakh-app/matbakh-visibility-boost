
import React from 'react';
import KpiCard from './KpiCard';

interface KpiGridProps {
  type?: 'gmb' | 'ga4';
}

const KpiGrid: React.FC<KpiGridProps> = ({ type }) => {
  if (type === 'gmb') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Impressionen"
          titleKey="impressions"
          description="Summe aller Impressionen deines Google-Profils in Suche & Maps. Zeigt, wie oft dein Eintrag potenziellen Kunden angezeigt wurde."
          benchmark={1000}
          comparePercentage={23}
          optimizeLink="/dashboard/ai-optimization?kpi=impressions"
        />
        
        <KpiCard
          title="Klickrate (CTR)"
          titleKey="ctr"
          description="Verhältnis von Klicks zu Impressionen, angezeigt als Prozent. Misst, wie oft Nutzer auf dein Profil geklickt haben, nachdem es angezeigt wurde."
          benchmark="5%"
          comparePercentage={-1.2}
          optimizeLink="/dashboard/ai-optimization?kpi=ctr"
        />
        
        <KpiCard
          title="Profilaufrufe"
          titleKey="profileViews"
          description="Anzahl der direkten Aufrufe deines Google Business Profils. Zeigt das Interesse der Nutzer an deinem Unternehmen."
          benchmark={500}
          comparePercentage={8}
          optimizeLink="/dashboard/ai-optimization?kpi=profileViews"
        />
        
        <KpiCard
          title="Anrufe"
          titleKey="calls"
          description="Anzahl der Anrufe über dein Google Business Profil. Direkter Kontakt zeigt hohes Kaufinteresse."
          benchmark={25}
          comparePercentage={12}
          optimizeLink="/dashboard/ai-optimization?kpi=calls"
        />
        
        <KpiCard
          title="Website-Klicks"
          titleKey="websiteClicks"
          description="Klicks auf den Website-Link in deinem Google Profil. Zeigt Traffic-Weiterleitung zu deiner Website."
          benchmark={80}
          comparePercentage={5}
          optimizeLink="/dashboard/ai-optimization?kpi=websiteClicks"
        />
        
        <KpiCard
          title="Routenanfragen"
          titleKey="directionsRequests"
          description="Anzahl der Wegbeschreibungs-Anfragen zu deinem Standort. Zeigt lokales Interesse und Besuchsabsicht."
          benchmark={40}
          comparePercentage={18}
          optimizeLink="/dashboard/ai-optimization?kpi=directionsRequests"
        />
        
        <KpiCard
          title="Foto-Aufrufe"
          titleKey="photoViews"
          description="Aufrufe deiner Fotos im Google Profil. Visuelle Inhalte steigern das Vertrauen und Interesse."
          benchmark={800}
          comparePercentage={22}
          optimizeLink="/dashboard/ai-optimization?kpi=photoViews"
        />
        
        <KpiCard
          title="Beitragsaufrufe"
          titleKey="postViews"
          description="Aufrufe deiner Google Posts (Updates, Angebote, Events). Zeigt Engagement mit deinen Inhalten."
          benchmark={150}
          comparePercentage={9}
          optimizeLink="/dashboard/ai-optimization?kpi=postViews"
        />
      </div>
    );
  }

  if (type === 'ga4') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Sitzungen"
          titleKey="sessions"
          description="Gesamtanzahl der Website-Besuche. Eine Sitzung umfasst alle Aktivitäten eines Nutzers während seines Besuchs."
          benchmark={2000}
          comparePercentage={7}
          optimizeLink="/dashboard/ai-optimization?kpi=sessions"
        />
        
        <KpiCard
          title="Absprungrate"
          titleKey="bounceRate"
          description="Prozentsatz der Besucher, die nach nur einer Seite wieder gehen. Niedrigere Werte bedeuten besseres Engagement."
          benchmark="60%"
          comparePercentage={-3}
          optimizeLink="/dashboard/ai-optimization?kpi=bounceRate"
        />
        
        <KpiCard
          title="Ø Sitzungsdauer"
          titleKey="avgSessionDuration"
          description="Durchschnittliche Zeit, die Nutzer auf deiner Website verbringen. Längere Zeiten zeigen höheres Interesse."
          benchmark="2:30"
          comparePercentage={12}
          optimizeLink="/dashboard/ai-optimization?kpi=avgSessionDuration"
        />
        
        <KpiCard
          title="Seitenaufrufe"
          titleKey="pageViews"
          description="Gesamtanzahl der aufgerufenen Seiten. Zeigt das Gesamtinteresse an deinen Inhalten."
          benchmark={4000}
          comparePercentage={6}
          optimizeLink="/dashboard/ai-optimization?kpi=pageViews"
        />
        
        <KpiCard
          title="Conversions"
          titleKey="conversions"
          description="Anzahl der abgeschlossenen Zielaktionen (Buchungen, Kontakt, etc.). Direkter Geschäftserfolg-Indikator."
          benchmark={30}
          comparePercentage={25}
          optimizeLink="/dashboard/ai-optimization?kpi=conversions"
        />
        
        <KpiCard
          title="Conversion-Rate"
          titleKey="conversionRate"
          description="Prozentsatz der Besucher, die eine gewünschte Aktion ausführen. Höhere Raten bedeuten bessere Website-Performance."
          benchmark="1.5%"
          comparePercentage={18}
          optimizeLink="/dashboard/ai-optimization?kpi=conversionRate"
        />
        
        <KpiCard
          title="Neue Nutzer"
          titleKey="newUsers"
          description="Anzahl der erstmaligen Website-Besucher. Zeigt die Reichweite und Neukundengewinnung."
          benchmark={1800}
          comparePercentage={14}
          optimizeLink="/dashboard/ai-optimization?kpi=newUsers"
        />
        
        <KpiCard
          title="Wiederkehrende Nutzer"
          titleKey="returningUsers"
          description="Anzahl der Nutzer, die bereits vorher auf der Website waren. Zeigt Kundenbindung und Interesse."
          benchmark={400}
          comparePercentage={3}
          optimizeLink="/dashboard/ai-optimization?kpi=returningUsers"
        />
      </div>
    );
  }

  return null;
};

export default KpiGrid;
