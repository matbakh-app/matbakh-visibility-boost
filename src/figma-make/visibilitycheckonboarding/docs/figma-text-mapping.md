# Figma Text Mapping - DE/EN Values

## Anleitung für Figma Integration

### 1. Component-Variants einrichten
Für jeden VC-Frame erstelle 2 Variants:
- **Variant Property**: `language = de` / `language = en`
- **Auto-Layout**: Aktiviert für responsive Text-Anpassung
- **Text-Styles**: Inter für Headlines, System-Font für Body-Text

### 2. LanguageSwitch-Integration
- Verknüpfe LanguageSwitch-Toggle mit Frame-Variants
- **Interaction**: On Click → Change to → Variant (language=en/de)
- **Transition**: Smart Animate, 200ms Ease-Out

### 3. Text-Elemente ersetzen
Ersetze alle i18n-Keys mit den unten aufgeführten echten Textwerten.

---

## 🏠 Landing Page - Text Values

### Header
- **DE**: "Visibility Check"
- **EN**: "Visibility Check"

### Hero Section
- **Title DE**: "Restaurant Sichtbarkeits-Analyse"
- **Title EN**: "Restaurant Visibility Analysis"
- **Subtitle DE**: "Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse"
- **Subtitle EN**: "Discover your online presence with AI-powered analysis"

### Free Analysis Block
- **Title DE**: "Kostenlose Sichtbarkeitsanalyse starten"
- **Title EN**: "Start Free Visibility Analysis"
- **Subtitle DE**: "Basis-Analyse mit eingeschränkten Features"
- **Subtitle EN**: "Basic analysis with limited features"

#### Feature 1
- **Title DE**: "Basis-Analyse"
- **Title EN**: "Basic Analysis"
- **Desc DE**: "Grundlegende Sichtbarkeits-Überprüfung Ihrer wichtigsten Plattformen"
- **Desc EN**: "Essential visibility check of your main platforms"

#### Feature 2
- **Title DE**: "Schnelle Insights"
- **Title EN**: "Quick Insights"
- **Desc DE**: "Sofortige Ergebnisse zu Ihrer digitalen Präsenz"
- **Desc EN**: "Instant results about your digital presence"

#### Feature 3
- **Title DE**: "Erste Empfehlungen"
- **Title EN**: "Initial Recommendations"
- **Desc DE**: "Grundlegende Optimierungsvorschläge für bessere Sichtbarkeit"
- **Desc EN**: "Basic optimization suggestions for better visibility"

#### Button & Info
- **Button DE**: "Basis-Analyse starten"
- **Button EN**: "Start Basic Analysis"
- **Info DE**: "Kostenlos • Keine Registrierung erforderlich • 3-5 Minuten"
- **Info EN**: "Free • No registration required • 3-5 minutes"

### Code Validation Block
- **Title DE**: "🎁 Haben Sie einen Gutschein-Code?"
- **Title EN**: "🎁 Do you have a voucher code?"
- **Subtitle DE**: "Codes erhalten Sie von Partnern oder per Email für erweiterte Analysen"
- **Subtitle EN**: "Get codes from partners or via email for advanced analyses"
- **Placeholder DE**: "Code eingeben"
- **Placeholder EN**: "Enter code"
- **Button DE**: "Code einlösen"
- **Button EN**: "Redeem code"

#### Validation Messages
- **Validating DE**: "Code wird validiert..."
- **Validating EN**: "Validating code..."
- **Success DE**: "✅ Vollzugang freigeschaltet von"
- **Success EN**: "✅ Full access unlocked by"
- **Error DE**: "❌ Code ungültig oder abgelaufen"
- **Error EN**: "❌ Code invalid or expired"
- **Expired DE**: "⏰ Code-Einlösefrist abgelaufen"
- **Expired EN**: "⏰ Code redemption period expired"
- **Used DE**: "⚠️ Code bereits verwendet"
- **Used EN**: "⚠️ Code already used"

#### Success Confirmation
- **Title DE**: "🎉 Code erfolgreich eingelöst!"
- **Title EN**: "🎉 Code successfully redeemed!"
- **Valid Until DE**: "Gültig bis"
- **Valid Until EN**: "Valid until"
- **Benefits DE**: "Mit Code freigeschaltet:"
- **Benefits EN**: "Unlocked with code:"
- **Start Premium DE**: "Premium-Analyse starten"
- **Start Premium EN**: "Start Premium Analysis"

### Account Creation Block
- **Title DE**: "Account erstellen"
- **Title EN**: "Create Account"
- **Subtitle DE**: "Vollzugang mit persönlichem Dashboard"
- **Subtitle EN**: "Full access with personal dashboard"
- **Feature1 DE**: "Gespeicherte Analyse-Historie"
- **Feature1 EN**: "Saved analysis history"
- **Feature2 DE**: "Monatliche Updates"
- **Feature2 EN**: "Monthly updates"
- **Feature3 DE**: "Erweiterte Features"
- **Feature3 EN**: "Advanced features"
- **Button DE**: "Jetzt registrieren"
- **Button EN**: "Register now"

---

## 🍽️ Restaurant Info Step - Text Values

### Header & Navigation
- **Title DE**: "Restaurant Information"
- **Title EN**: "Restaurant Information"
- **Breadcrumb Home DE**: "VC Startseite"
- **Breadcrumb Home EN**: "VC Homepage"
- **Back DE**: "Zurück"
- **Back EN**: "Back"

### Progress & Content
- **Step DE**: "Schritt 1 von 2"
- **Step EN**: "Step 1 of 2"
- **Headline DE**: "Erzählen Sie uns von Ihrem Restaurant"
- **Headline EN**: "Tell us about your restaurant"
- **Subtitle DE**: "Diese Informationen helfen uns, eine präzise Analyse zu erstellen"
- **Subtitle EN**: "This information helps us create a precise analysis"

### Form Fields
- **Name Label DE**: "Restaurant Name"
- **Name Label EN**: "Restaurant Name"
- **Name Placeholder DE**: "z.B. Ristorante Milano"
- **Name Placeholder EN**: "e.g. Ristorante Milano"
- **Address Label DE**: "Adresse"
- **Address Label EN**: "Address"
- **Address Placeholder DE**: "Straße, PLZ Stadt"
- **Address Placeholder EN**: "Street, ZIP City"
- **Phone Label DE**: "Telefon"
- **Phone Label EN**: "Phone"
- **Phone Placeholder DE**: "+49 30 12345678"
- **Phone Placeholder EN**: "+1 555 123-4567"
- **Website Label DE**: "Website"
- **Website Label EN**: "Website"
- **Website Placeholder DE**: "www.restaurant.de"
- **Website Placeholder EN**: "www.restaurant.com"
- **Category Label DE**: "Hauptkategorie"
- **Category Label EN**: "Main Category"
- **Category Placeholder DE**: "Wählen Sie eine Kategorie"
- **Category Placeholder EN**: "Select a category"
- **Price Label DE**: "Preisklasse"
- **Price Label EN**: "Price Range"
- **Price Placeholder DE**: "Wählen Sie eine Preisklasse"
- **Price Placeholder EN**: "Select a price range"
- **Services Label DE**: "Zusätzliche Services (optional)"
- **Services Label EN**: "Additional Services (optional)"

### Categories
- **Italian DE**: "Italienisch" | **Italian EN**: "Italian"
- **German DE**: "Deutsch" | **German EN**: "German"
- **Asian DE**: "Asiatisch" | **Asian EN**: "Asian"
- **French DE**: "Französisch" | **French EN**: "French"
- **Greek DE**: "Griechisch" | **Greek EN**: "Greek"
- **Turkish DE**: "Türkisch" | **Turkish EN**: "Turkish"
- **Pizza DE**: "Pizza" | **Pizza EN**: "Pizza"
- **Burger DE**: "Burger" | **Burger EN**: "Burger"
- **Sushi DE**: "Sushi" | **Sushi EN**: "Sushi"
- **Cafe DE**: "Café/Bistro" | **Cafe EN**: "Café/Bistro"
- **FastFood DE**: "Fast Food" | **FastFood EN**: "Fast Food"
- **FineDining DE**: "Fine Dining" | **FineDining EN**: "Fine Dining"
- **Vegetarian DE**: "Vegetarisch/Vegan" | **Vegetarian EN**: "Vegetarian/Vegan"
- **Other DE**: "Sonstiges" | **Other EN**: "Other"

### Services
- **Delivery DE**: "Lieferservice" | **Delivery EN**: "Delivery"
- **Catering DE**: "Catering" | **Catering EN**: "Catering"
- **TakeAway DE**: "Take Away" | **TakeAway EN**: "Take Away"
- **Breakfast DE**: "Frühstück" | **Breakfast EN**: "Breakfast"
- **Lunch DE**: "Mittagstisch" | **Lunch EN**: "Lunch Menu"
- **Bar DE**: "Bar/Cocktails" | **Bar EN**: "Bar/Cocktails"
- **Terrace DE**: "Terrasse/Garten" | **Terrace EN**: "Terrace/Garden"
- **Family DE**: "Familienfreundlich" | **Family EN**: "Family-Friendly"
- **Business DE**: "Business Lunch" | **Business EN**: "Business Lunch"
- **Events DE**: "Events/Feiern" | **Events EN**: "Events/Celebrations"

### Price Ranges
- **Budget DE**: "€ - Günstig (bis 15€)" | **Budget EN**: "$ - Budget (up to $20)"
- **Moderate DE**: "€€ - Mittel (15-30€)" | **Moderate EN**: "$$ - Moderate ($20-40)"
- **Upscale DE**: "€€€ - Gehoben (30-50€)" | **Upscale EN**: "$$$ - Upscale ($40-70)"
- **Luxury DE**: "€€€€ - Luxus (50€+)" | **Luxury EN**: "$$$$ - Luxury ($70+)"

### Actions
- **Back DE**: "Zurück zur VC-Startseite"
- **Back EN**: "Back to VC Homepage"
- **Next DE**: "Weiter"
- **Next EN**: "Continue"

---

## 🌐 Website Analysis Step - Text Values

### Header & Progress
- **Title DE**: "Website & Analyse-Einstellungen"
- **Title EN**: "Website & Analysis Settings"
- **Step DE**: "Schritt 2 von 2"
- **Step EN**: "Step 2 of 2"
- **Headline DE**: "Website & Vergleiche"
- **Headline EN**: "Website & Comparisons"

### Website Section
- **Website Label DE**: "Website (optional)"
- **Website Label EN**: "Website (optional)"
- **Website Placeholder DE**: "https://meinrestaurant.de"
- **Website Placeholder EN**: "https://myrestaurant.com"

### Benchmarks Section
- **Benchmarks Label DE**: "Vergleichbare Unternehmen (Benchmarks)"
- **Benchmarks Label EN**: "Comparable Businesses (Benchmarks)"
- **Benchmarks Desc DE**: "Tragen Sie bis zu 3 Lokale ein, mit denen Sie sich vergleichen möchten."
- **Benchmarks Desc EN**: "Enter up to 3 businesses you want to compare with."
- **Benchmark1 Placeholder DE**: "z. B. Weinbar X in München"
- **Benchmark1 Placeholder EN**: "e.g. Wine Bar X in New York"
- **Benchmark2 Placeholder DE**: "optional"
- **Benchmark2 Placeholder EN**: "optional"

### Email Section
- **Email Title DE**: "E-Mail & Datenschutz"
- **Email Title EN**: "E-Mail & Privacy"
- **Email Desc DE**: "Für den PDF-Report und weitere Analysen benötigen wir Ihre E-Mail-Adresse."
- **Email Desc EN**: "We need your email address for the PDF report and further analyses."
- **Email Label DE**: "E-Mail-Adresse"
- **Email Label EN**: "E-Mail Address"
- **Email Placeholder DE**: "ihre.email@beispiel.de"
- **Email Placeholder EN**: "your.email@example.com"

### Privacy Consent
- **Privacy Label DE**: "Datenschutz-Einverständnis"
- **Privacy Label EN**: "Privacy Consent"
- **Privacy Text DE**: "Ich stimme der Verarbeitung meiner Daten für die Sichtbarkeits-Analyse zu."
- **Privacy Text EN**: "I agree to the processing of my data for the visibility analysis."
- **EmailReport Label DE**: "E-Mail Report Einverständnis"
- **EmailReport Label EN**: "Email Report Consent"
- **EmailReport Text DE**: "Ich stimme zu, dass der PDF-Report an meine E-Mail-Adresse gesendet wird."
- **EmailReport Text EN**: "I agree that the PDF report will be sent to my email address."
- **Marketing Label DE**: "Marketing-Einverständnis (optional)"
- **Marketing Label EN**: "Marketing Consent (optional)"
- **Marketing Text DE**: "Ich möchte über neue Features und Gastro-Tipps informiert werden."
- **Marketing Text EN**: "I want to be informed about new features and restaurant tips."

### Email Flow
- **Warning Title DE**: "Wichtig"
- **Warning Title EN**: "Important"
- **Warning Text DE**: "Sie erhalten eine Bestätigungs-E-Mail. Erst nach Bestätigung wird der vollständige Report generiert."
- **Warning Text EN**: "You will receive a confirmation email. The full report will only be generated after confirmation."
- **Confirm Email DE**: "Bestätigungs-E-Mail senden"
- **Confirm Email EN**: "Send confirmation email"
- **Sending DE**: "Bestätigungs-E-Mail wird gesendet..."
- **Sending EN**: "Sending confirmation email..."
- **Sent DE**: "E-Mail versendet!"
- **Sent EN**: "Email sent!"
- **Sent Text DE**: "Wir haben eine Bestätigungs-E-Mail an"
- **Sent Text EN**: "We have sent a confirmation email to"
- **Click Link DE**: "Klicken Sie auf den Link in der E-Mail, um fortzufahren."
- **Click Link EN**: "Click the link in the email to continue."
- **Already Confirmed DE**: "Bereits bestätigt? Hier klicken"
- **Already Confirmed EN**: "Already confirmed? Click here"
- **Confirmed DE**: "E-Mail bestätigt!"
- **Confirmed EN**: "Email confirmed!"
- **Can Start DE**: "Sie können nun die Analyse starten."
- **Can Start EN**: "You can now start the analysis."

### Actions
- **Start Analysis DE**: "Analyse starten"
- **Start Analysis EN**: "Start analysis"
- **Back DE**: "Zurück zu Step 1"
- **Back EN**: "Back to Step 1"

---

## ⚡ AI Loading Screen - Text Values

### Header & Main
- **Title DE**: "KI-Analyse läuft"
- **Title EN**: "AI Analysis in Progress"
- **Subtitle DE**: "Ihre Sichtbarkeits-Analyse wird erstellt"
- **Subtitle EN**: "Your visibility analysis is being created"

### Progress Section
- **Analyzing DE**: "Analysiere Ihre Daten"
- **Analyzing EN**: "Analyzing your data"
- **Step DE**: "Schritt"
- **Step EN**: "Step"
- **Of DE**: "von"
- **Of EN**: "of"
- **Remaining DE**: "Verbleibend"
- **Remaining EN**: "Remaining"
- **Elapsed DE**: "Vergangen"
- **Elapsed EN**: "Elapsed"
- **Running DE**: "Läuft"
- **Running EN**: "Running"

### Pipeline Steps
#### Step 1: Initialization
- **Title DE**: "System initialisieren"
- **Title EN**: "Initialize system"
- **Desc DE**: "Vorbereitung der Analyse-Umgebung und KI-Module"
- **Desc EN**: "Preparing analysis environment and AI modules"

#### Step 2: Data Collection
- **Title DE**: "Daten sammeln"
- **Title EN**: "Collect data"
- **Desc DE**: "Erfassung von Restaurant-Informationen und Online-Präsenz"
- **Desc EN**: "Gathering restaurant information and online presence"

#### Step 3: Platform Analysis
- **Title DE**: "Plattformen analysieren"
- **Title EN**: "Analyze platforms"
- **Desc DE**: "Überprüfung von Google, Social Media und Review-Plattformen"
- **Desc EN**: "Checking Google, social media and review platforms"

#### Step 4: AI Processing
- **Title DE**: "KI-Verarbeitung"
- **Title EN**: "AI processing"
- **Desc DE**: "Intelligente Analyse und Mustererkennung durch Machine Learning"
- **Desc EN**: "Intelligent analysis and pattern recognition through machine learning"

#### Step 5: Recommendations
- **Title DE**: "Empfehlungen generieren"
- **Title EN**: "Generate recommendations"
- **Desc DE**: "Erstellung personalisierter Optimierungsvorschläge"
- **Desc EN**: "Creating personalized optimization suggestions"

#### Step 6: Finalization
- **Title DE**: "Report finalisieren"
- **Title EN**: "Finalize report"
- **Desc DE**: "Zusammenstellung der Ergebnisse und PDF-Generierung"
- **Desc EN**: "Compiling results and generating PDF report"

### Info & Actions
- **Pipeline Title DE**: "Analyse-Pipeline"
- **Pipeline Title EN**: "Analysis Pipeline"
- **Info Title DE**: "Analyse-Informationen"
- **Info Title EN**: "Analysis Information"
- **Plan DE**: "Plan"
- **Plan EN**: "Plan"
- **Usage DE**: "Nutzung"
- **Usage EN**: "Usage"
- **Priority DE**: "Priorität"
- **Priority EN**: "Priority"
- **Type DE**: "Typ"
- **Type EN**: "Type"
- **High DE**: "Hoch"
- **High EN**: "High"
- **Normal DE**: "Normal"
- **Normal EN**: "Normal"
- **Full Analysis DE**: "Vollständige Analyse"
- **Full Analysis EN**: "Full Analysis"
- **Cancel DE**: "Analyse abbrechen"
- **Cancel EN**: "Cancel analysis"
- **Cancel Note DE**: "Die Analyse kann jederzeit abgebrochen werden"
- **Cancel Note EN**: "The analysis can be cancelled at any time"

---

## 🔧 Common Elements - Text Values

### Navigation & Actions
- **Back DE**: "Zurück"
- **Back EN**: "Back"
- **Next DE**: "Weiter"
- **Next EN**: "Next"
- **Cancel DE**: "Abbrechen"
- **Cancel EN**: "Cancel"
- **Save DE**: "Speichern"
- **Save EN**: "Save"
- **Loading DE**: "Wird geladen..."
- **Loading EN**: "Loading..."
- **Error DE**: "Fehler"
- **Error EN**: "Error"
- **Success DE**: "Erfolgreich"
- **Success EN**: "Success"
- **Required DE**: "Pflichtfeld"
- **Required EN**: "Required"

### Buttons
- **Start DE**: "Starten"
- **Start EN**: "Start"
- **Upgrade DE**: "Upgrade"
- **Upgrade EN**: "Upgrade"
- **Login DE**: "Anmelden"
- **Login EN**: "Login"
- **Register DE**: "Registrieren"
- **Register EN**: "Register"
- **Retry DE**: "Erneut versuchen"
- **Retry EN**: "Retry"
- **Continue DE**: "Fortfahren"
- **Continue EN**: "Continue"

### Plans
- **Basic DE**: "Basic Plan - 1 Analyse täglich"
- **Basic EN**: "Basic Plan - 1 analysis daily"
- **Business DE**: "Business Plan - 3 Analysen täglich"
- **Business EN**: "Business Plan - 3 analyses daily"
- **Premium DE**: "Premium Plan - Unbegrenzte Analysen"
- **Premium EN**: "Premium Plan - Unlimited analyses"

---

## 🎨 Design-System Specifications

### Typography
- **Headlines (h1-h4)**: Inter, var(--font-family-heading)
- **Body/Labels**: System Font, var(--font-family-body)
- **Font Weights**: Normal (400), Medium (500), Semibold (600)

### Colors (exakte Hex-Werte)
- **Primary**: #4F46E5
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Background**: #ffffff
- **Muted**: #f1f5f9

### Spacing (8px Grid)
- **Spacing 1**: 8px
- **Spacing 2**: 16px
- **Spacing 3**: 24px
- **Spacing 4**: 32px
- **Spacing 6**: 48px
- **Spacing 8**: 64px

### Auto-Layout Settings
- **Direction**: Vertical/Horizontal je nach Content
- **Spacing**: var(--spacing-2) bis var(--spacing-4)
- **Padding**: var(--spacing-2) bis var(--spacing-6)
- **Fill Container**: Ja für responsive Behavior
- **Hug Contents**: Für Buttons und Labels

Diese Werte ermöglichen eine pixelgenaue Umsetzung des Design-Systems in Figma mit vollständiger DE/EN-Sprachunterstützung.