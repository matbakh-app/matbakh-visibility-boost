#!/usr/bin/env node
/**
 * Microcopy Extractor für VC (DE)
 * Parst docs/specs/vc/microcopy.de.md und generiert public/locales/de/vc_microcopy.json
 */

import * as fs from 'fs';
import * as path from 'path';

const MICROCOPY_SOURCE = 'docs/specs/vc/microcopy.de.md';
const OUTPUT_PATH = 'public/locales/de/vc_microcopy.json';

interface MicrocopyEntry {
  [key: string]: string;
}

function extractMicrocopy(): MicrocopyEntry {
  const content = fs.readFileSync(MICROCOPY_SOURCE, 'utf-8');
  const result: MicrocopyEntry = {};

  // Parse sections and extract key-value pairs
  const sections = content.split(/^## \d+\./gm);
  
  sections.forEach(section => {
    const lines = section.split('\n');
    const sectionTitle = lines[0]?.trim().toLowerCase();
    
    if (sectionTitle.includes('identify')) {
      // Section 1: Identify Form
      extractIdentifySection(section, result);
    } else if (sectionTitle.includes('teaser')) {
      // Section 2: Teaser Result
      extractTeaserSection(section, result);
    } else if (sectionTitle.includes('doi') || sectionTitle.includes('e-mail')) {
      // Section 3: DOI/Email
      extractDoiSection(section, result);
    } else if (sectionTitle.includes('handlungsempfehlungen')) {
      // Section 4: Actions
      extractActionsSection(section, result);
    } else if (sectionTitle.includes('og') || sectionTitle.includes('share')) {
      // Section 5: OG/Share
      extractOgSection(section, result);
    } else if (sectionTitle.includes('tonalität')) {
      // Section 6: Tone (metadata, not extracted)
      // Skip - this is guidance, not UI copy
    }
  });

  return result;
}

function extractIdentifySection(section: string, result: MicrocopyEntry): void {
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Field labels
    if (trimmed.includes('Unternehmen (Pflicht):')) {
      result['identify.fields.name'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Adresse (Pflicht):')) {
      result['identify.fields.address'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Website (optional):')) {
      result['identify.fields.website'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Instagram (optional):')) {
      result['identify.fields.instagram'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Facebook (optional):')) {
      result['identify.fields.facebook'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('E-Mail (optional')) {
      result['identify.fields.email'] = extractQuotedText(trimmed);
    }
    
    // Help texts
    else if (trimmed.includes('Unternehmen:') && trimmed.includes('So wie Gäste')) {
      result['identify.help.name'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Adresse:') && trimmed.includes('Reicht auch')) {
      result['identify.help.address'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Website/SoMe:')) {
      result['identify.help.social'] = extractQuotedText(trimmed);
    }
    
    // Buttons
    else if (trimmed.includes('Primär:')) {
      result['identify.btn.primary'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Sekundär')) {
      result['identify.btn.secondary'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Loading:')) {
      result['identify.btn.loading'] = extractQuotedText(trimmed);
    }
    
    // Errors
    else if (trimmed.includes('Validation:')) {
      result['identify.error.validation'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Keine Kandidaten:')) {
      result['identify.error.noCandidates'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Mehrdeutig:')) {
      result['identify.error.ambiguous'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Rate-Limit:')) {
      result['identify.error.rateLimit'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Server:')) {
      result['identify.error.server'] = extractQuotedText(trimmed);
    }
  });
}

function extractTeaserSection(section: string, result: MicrocopyEntry): void {
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('Deine lokale Sichtbarkeit:')) {
      result['teaser.title'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Erster Eindruck:')) {
      result['teaser.title.alt'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Du liegst')) {
      result['teaser.description'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Stark bei')) {
      result['teaser.description.alt'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Google-Präsenz')) {
      result['teaser.badge.google'] = 'Google-Präsenz';
      result['teaser.badge.social'] = 'Social-Aktivität';
      result['teaser.badge.website'] = 'Website-Basics';
      result['teaser.badge.reviews'] = 'Bewertungen';
    } else if (trimmed.includes('Quelle:')) {
      result['teaser.evidence'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Nächste Schritte')) {
      result['teaser.cta.primary'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Bericht per E-Mail')) {
      result['teaser.cta.email'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Momentan keine verwertbaren')) {
      result['teaser.error.noEvidence'] = extractQuotedText(trimmed);
    }
  });
}

function extractDoiSection(section: string, result: MicrocopyEntry): void {
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('Wir senden dir den vollständigen')) {
      result['doi.info'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('E-Mail senden')) {
      result['doi.cta'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Check deine Inbox')) {
      result['doi.sent'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Kein Risiko')) {
      result['doi.disclaimer'] = extractQuotedText(trimmed);
    }
  });
}

function extractActionsSection(section: string, result: MicrocopyEntry): void {
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('Schnelle Gewinne zuerst:')) {
      result['actions.intro'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Story-Post:')) {
      result['actions.story'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Bilder-Post:')) {
      result['actions.image'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Google-Beitrag:')) {
      result['actions.google'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Prognose (unverbindlich):')) {
      result['actions.roi'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Vorschlag prüfen')) {
      result['actions.flow'] = extractQuotedText(trimmed);
    }
  });
}

function extractOgSection(section: string, result: MicrocopyEntry): void {
  const lines = section.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('Wie sichtbar ist')) {
      result['og.title'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Ergebnis in 1 Minute:')) {
      result['og.description'] = extractQuotedText(trimmed);
    } else if (trimmed.includes('Sichtbarkeits-Vorschau')) {
      result['og.alt'] = extractQuotedText(trimmed);
    }
  });
}

function extractQuotedText(line: string): string {
  const match = line.match(/„([^"]+)"/);
  if (match) {
    return match[1];
  }
  
  // Fallback for regular quotes
  const quotedMatch = line.match(/"([^"]+)"/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  
  // If no quotes found, try to extract after colon
  const colonMatch = line.match(/:\s*(.+)$/);
  if (colonMatch) {
    return colonMatch[1].replace(/[„"]/g, '');
  }
  
  return line.trim();
}

function main(): void {
  try {
    console.log('🔄 Extracting VC microcopy from', MICROCOPY_SOURCE);
    
    const microcopy = extractMicrocopy();
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(microcopy, null, 2), 'utf-8');
    
    console.log('✅ Generated', OUTPUT_PATH);
    console.log('📊 Extracted', Object.keys(microcopy).length, 'keys');
    
    // Show sample keys
    const sampleKeys = Object.keys(microcopy).slice(0, 5);
    console.log('🔑 Sample keys:', sampleKeys.join(', '));
    
  } catch (error) {
    console.error('❌ Error extracting microcopy:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();