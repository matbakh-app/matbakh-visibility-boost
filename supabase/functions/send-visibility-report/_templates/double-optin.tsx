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

interface DoubleOptInEmailProps {
  businessName: string;
  verifyUrl: string;
  email: string;
}

export const DoubleOptInEmail = ({
  businessName,
  verifyUrl,
  email,
}: DoubleOptInEmailProps) => (
  <Html>
    <Head />
    <Preview>Bestätigen Sie Ihre E-Mail für den Sichtbarkeits-Check</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sichtbarkeits-Check bestätigen</Heading>
        
        <Text style={text}>
          Hallo!
        </Text>
        
        <Text style={text}>
          Sie haben einen Sichtbarkeits-Check für <strong>{businessName}</strong> angefragt. 
          Um Ihren individuellen Report zu erhalten, bestätigen Sie bitte Ihre E-Mail-Adresse.
        </Text>
        
        <Section style={buttonContainer}>
          <Button href={verifyUrl} style={button}>
            E-Mail-Adresse bestätigen
          </Button>
        </Section>
        
        <Text style={text}>
          Nach der Bestätigung erhalten Sie automatisch Ihren detaillierten Sichtbarkeits-Report 
          mit konkreten Empfehlungen für <strong>{businessName}</strong>.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={smallText}>
          Falls der Button nicht funktioniert, können Sie auch diesen Link verwenden:<br />
          <Link href={verifyUrl} style={link}>
            {verifyUrl}
          </Link>
        </Text>
        
        <Text style={smallText}>
          Diese E-Mail wurde an {email} gesendet. Falls Sie keinen Sichtbarkeits-Check 
          angefragt haben, können Sie diese E-Mail ignorieren.
        </Text>
        
        <Text style={footer}>
          Mit freundlichen Grüßen<br />
          Ihr matbakh.app Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DoubleOptInEmail;

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

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
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

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '18px',
  marginTop: '32px',
};