# VC Spec — Vision (user perspective)

**AUTHOR:** Product Owner  
**STATUS:** Draft

## 1. Story (Happy Path)
1) Ich öffne `/vc/quick`.
2) Ich gebe meine E-Mail (und optional meinen Namen) ein.
3) Ich sehe sofort eine klare Bestätigung: „Bitte bestätige deine E-Mail…"
4) Ich klicke in der Mail den Link → werde auf `/vc/result?t=...` geleitet.
5) Die Seite zeigt „Erfolgreich bestätigt" und bietet mir einen klaren Next Step.

## 2. Fehlerfälle
- **Ungültig**: Ich lande auf `/vc/result?e=invalid` → kurze Erklärung + Button „Neuen Link anfordern" → `/vc/quick`.
- **Abgelaufen**: `/vc/result?e=expired` → gleiche Lösung wie oben.

## 3. Ton & Gefühl
- Unaufgeregt, klar, professionell. Keine Hektik. Kurze Sätze, eindeutige CTAs.
- Mobile-first, wenig Ablenkung, Fokus auf E-Mail-Eingabe & Nächste Schritte.

## 4. Was mir wichtig ist
- Kein Account-Zwang vorab.
- Kein technisches Kauderwelsch in Fehlermeldungen.
- Immer ein sichtbarer Ausweg (CTA) bei Fehlern.

## 5. Später (nicht jetzt)
- Login/Register
- Google OAuth
- Erweiterte Profilabfragen

---

**Hinweis:** Dieses 2-Dateien-Muster bitte bei jeder neuen Spec wiederverwenden (requirements.*.md + vision.*.md im passenden Unterordner).