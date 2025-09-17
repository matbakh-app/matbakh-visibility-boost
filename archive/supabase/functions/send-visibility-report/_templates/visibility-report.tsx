import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface VisibilityReportEmailProps {
  businessName: string;
  email: string;
  analysisData: any;
  reportUrl: string;
}

export const VisibilityReportEmail = ({
  businessName,
  email,
  analysisData,
  reportUrl,
}: VisibilityReportEmailProps) => {
  const overallScore = analysisData?.overallScore || 0;
  const platformAnalyses = analysisData?.platformAnalyses || [];
  const quickWins = analysisData?.quickWins || [];

  return (
    <Html>
      <Head />
      <Preview>Ihr Sichtbarkeits-Report für {businessName} ist fertig!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Ihr Sichtbarkeits-Report ist fertig!</Heading>
          
          <Text style={text}>
            Hallo!
          </Text>
          
          <Text style={text}>
            Ihr individueller Sichtbarkeits-Report für <strong>{businessName}</strong> wurde erfolgreich erstellt.
          </Text>
          
          <Section style={scoreContainer}>
            <Text style={scoreText}>Ihr Gesamt-Score:</Text>
            <Text style={scoreNumber}>{overallScore}/100</Text>
          </Section>
          
          {platformAnalyses.length > 0 && (
            <Section>
              <Heading style={h2}>Ihre Plattform-Ergebnisse:</Heading>
              {platformAnalyses.map((platform: any, index: number) => (
                <Text key={index} style={platformText}>
                  • <strong>{platform.platform?.toUpperCase() || 'Platform'}</strong>: {platform.score || 0}/100 Punkte
                  {platform.profileFound ? ' ✅' : ' ❌ Profil nicht gefunden'}
                </Text>
              ))}
            </Section>
          )}
          
          {quickWins.length > 0 && (
            <Section>
              <Heading style={h2}>Ihre Quick Wins:</Heading>
              {quickWins.slice(0, 3).map((win: string, index: number) => (
                <Text key={index} style={quickWinText}>
                  ✨ {win}
                </Text>
              ))}
            </Section>
           )}
           
           {/* Google Metrics Section */}
           {(analysisData?.gmb_metrics || analysisData?.ga4_metrics || analysisData?.ads_metrics) && (
             <Section>
               <Heading style={h2}>Google Services Metriken:</Heading>
               
               {analysisData.gmb_metrics && Object.keys(analysisData.gmb_metrics).length > 0 && (
                 <Section>
                   <Text style={text}><strong>Google My Business:</strong></Text>
                   {analysisData.gmb_metrics.rating && (
                     <Text style={platformText}>• Bewertung: {analysisData.gmb_metrics.rating} ⭐</Text>
                   )}
                   {analysisData.gmb_metrics.reviewCount !== undefined && (
                     <Text style={platformText}>• Anzahl Bewertungen: {analysisData.gmb_metrics.reviewCount}</Text>
                   )}
                   {analysisData.gmb_metrics.profileComplete !== undefined && (
                     <Text style={platformText}>• Profil vollständig: {analysisData.gmb_metrics.profileComplete ? 'Ja ✅' : 'Nein ❌'}</Text>
                   )}
                   {analysisData.gmb_metrics.hasPhotos !== undefined && (
                     <Text style={platformText}>• Fotos vorhanden: {analysisData.gmb_metrics.hasPhotos ? 'Ja ✅' : 'Nein ❌'}</Text>
                   )}
                 </Section>
               )}
               
               {analysisData.ga4_metrics && Object.keys(analysisData.ga4_metrics).length > 0 && (
                 <Section>
                   <Text style={text}><strong>Google Analytics 4:</strong></Text>
                   {analysisData.ga4_metrics.sessions !== undefined && (
                     <Text style={platformText}>• Sitzungen: {analysisData.ga4_metrics.sessions.toLocaleString()}</Text>
                   )}
                   {analysisData.ga4_metrics.pageviews !== undefined && (
                     <Text style={platformText}>• Seitenaufrufe: {analysisData.ga4_metrics.pageviews.toLocaleString()}</Text>
                   )}
                   {analysisData.ga4_metrics.bounceRate !== undefined && (
                     <Text style={platformText}>• Absprungrate: {(analysisData.ga4_metrics.bounceRate * 100).toFixed(1)}%</Text>
                   )}
                   {analysisData.ga4_metrics.avgSessionDuration !== undefined && (
                     <Text style={platformText}>• Ø Sitzungsdauer: {Math.round(analysisData.ga4_metrics.avgSessionDuration)}s</Text>
                   )}
                 </Section>
               )}
               
               {analysisData.ads_metrics && Object.keys(analysisData.ads_metrics).length > 0 && (
                 <Section>
                   <Text style={text}><strong>Google Ads:</strong></Text>
                   {analysisData.ads_metrics.impressions !== undefined && (
                     <Text style={platformText}>• Impressions: {analysisData.ads_metrics.impressions.toLocaleString()}</Text>
                   )}
                   {analysisData.ads_metrics.clicks !== undefined && (
                     <Text style={platformText}>• Klicks: {analysisData.ads_metrics.clicks.toLocaleString()}</Text>
                   )}
                   {analysisData.ads_metrics.ctr !== undefined && (
                     <Text style={platformText}>• CTR: {(analysisData.ads_metrics.ctr * 100).toFixed(2)}%</Text>
                   )}
                   {analysisData.ads_metrics.cost !== undefined && (
                     <Text style={platformText}>• Kosten: €{analysisData.ads_metrics.cost.toFixed(2)}</Text>
                   )}
                 </Section>
               )}
             </Section>
           )}
          
          <Section style={buttonContainer}>
            <Button href={reportUrl} style={button}>
              Vollständigen PDF-Report herunterladen
            </Button>
          </Section>
          
          <Text style={text}>
            In Ihrem detaillierten Report finden Sie:
          </Text>
          
          <Text style={listText}>
            • Detaillierte Analyse aller Plattformen<br />
            • Konkrete Handlungsempfehlungen<br />
            • Benchmark-Vergleiche mit der Konkurrenz<br />
            • Priorisierte To-Do-Liste für bessere Sichtbarkeit
          </Text>
          
          <Hr style={hr} />
          
          <Text style={text}>
            <strong>Möchten Sie Ihre Online-Sichtbarkeit professionell optimieren?</strong>
          </Text>
          
          <Text style={text}>
            Unser Team hilft Ihnen dabei, alle Empfehlungen umzusetzen. 
            <Link href="https://matbakh.app/services" style={link}>
              Erfahren Sie mehr über unsere Services
            </Link>
          </Text>
          
          <Text style={footer}>
            Mit freundlichen Grüßen<br />
            Ihr matbakh.app Team<br />
            <Link href="mailto:mail@matbakh.app" style={link}>mail@matbakh.app</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VisibilityReportEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '24px 0 12px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const scoreContainer = {
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const scoreText = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const scoreNumber = {
  color: '#000',
  fontSize: '36px',
  fontWeight: '700',
  margin: '8px 0 0',
};

const platformText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 8px',
};

const quickWinText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 8px',
  paddingLeft: '4px',
};

const listText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
  paddingLeft: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const hr = {
  borderColor: '#ddd',
  margin: '32px 0',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '18px',
  marginTop: '32px',
};