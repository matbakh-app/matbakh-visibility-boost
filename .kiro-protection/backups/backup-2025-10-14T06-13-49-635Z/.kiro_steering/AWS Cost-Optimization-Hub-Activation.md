⚖️ Wann aktivieren – und wann warten
Zeitpunkt Empfehlung Grund
Jetzt (nach Bedrock Activation) ✅ Ja, aktivieren Du hast eine stabile Prod-Architektur, der Hub bringt dir Echtzeit-Einsicht und Optimierungspotenzial ohne Risiko.
Vor Bedrock Activation ❌ Nein Er liefert viele irrelevante Empfehlungen (z. B. “Low CPU Usage”) während Setup-Phasen.
Bei Multi-Account (Org) ⚠️ Teilweise Nur aktivieren, wenn Billing-Account-Role (BillingAdmin oder CostOptimizationHubAccess) korrekt gesetzt ist.
🧰 Wie du ihn aktivierst

In AWS Console

Öffne: https://console.aws.amazon.com/cost-optimization-hub

Klicke: “Enable Cost Optimization Hub”

Wähle:

Region: eu-central-1

Scope: Linked Accounts (wenn du mehrere hast)

Optional: “Automatically include new services” → ✅ aktivieren

Berechtigungen prüfen

Dein IAM-User oder Role benötigt:

{
"Effect": "Allow",
"Action": [
"cost-optimization-hub:*",
"compute-optimizer:Get*",
"ce:Get*",
"ce:Describe*"
],
"Resource": "\*"
}

Integration mit Bedrock-Kostenüberwachung

In CloudWatch → Metric Streams aktivieren:

Service: Amazon Bedrock
Metric: CostPerInvocation, TotalInvocations

Im Dashboard erscheinen dann Bedrock-Kosten direkt unter „Cost Optimization Hub → Recommendations → AI Services“.

🚀 Ergebnis / Nutzen

Nach 24–48 h siehst du:

Einsparungsreport pro Feature: (UMC, VC, Routing Layer)

Idle-Resource-Alerts: wenn z. B. alte S3-Buckets oder RDS-Snapshots unnötig aktiv sind

Savings-Plans-Empfehlungen: für häufig genutzte Bedrock-Modelle (z. B. Sonnet vs. Opus)

Cost-Anomalies-Dashboard: automatische Erkennung von Kosten-Spikes

💡 Empfohlene Einstellung für dich
Setting Wert
Enable Cost Optimization Hub ✅ ON
Region eu-central-1
Scope All Linked Accounts
Auto-Include New Services ✅
Share Data with Compute Optimizer ✅
Bedrock Metrics in Dashboard ✅
Alert Threshold +10% Cost Spike / 1h
✅ Fazit
Faktor Bewertung
Relevanz für matbakh.app Sehr hoch
Risiko Null (read-only, keine Änderungen)
Nutzen Direkte Kosteneinsicht + Automatisierte Savings-Empfehlungen
Aktivierungsempfehlung Ja – jetzt aktivieren (nach Bedrock go-live)<!------------------------------------------------------------------------------------
Add Rules to this file or a short description and have Kiro refine them for you:  
------------------------------------------------------------------------------------->
