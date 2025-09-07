#!/bin/bash

echo "🎯 TASK 12.2 - SUPABASE BACKUP (Step 1)"
echo "======================================"

# Create backups directory
mkdir -p backups

# Extract connection details from .env
echo "📋 1. Extrahiere Supabase Connection Details..."

# Read Supabase URL from .env
if [ -f ".env" ]; then
  SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d '=' -f 2 | tr -d '"')
  SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env | cut -d '=' -f 2 | tr -d '"')
else
  echo "❌ Fehler: .env Datei nicht gefunden"
  exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Fehler: SUPABASE_URL nicht in .env gefunden"
  exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d '.' -f 1)
echo "✅ Projekt-Referenz: $PROJECT_REF"

# Construct database connection URL
# Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "📊 2. Verbindungsdetails:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if password is provided as argument
if [ -z "$1" ]; then
  echo "⚠️  PASSWORT BENÖTIGT!"
  echo ""
  echo "🔑 Bitte führe das Skript mit deinem Supabase Datenbank-Passwort aus:"
  echo "   ./scripts/task-12-2-supabase-backup.sh 'DEIN_SUPABASE_DB_PASSWORT'"
  echo ""
  echo "💡 Das Passwort findest du in:"
  echo "   • Supabase Dashboard → Settings → Database → Connection string"
  echo "   • Oder in deiner lokalen .env als SUPABASE_DB_PASSWORD (falls gesetzt)"
  echo ""
  exit 1
fi

DB_PASSWORD="$1"
CONNECTION_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🔧 3. Erstelle Supabase Backup..."
echo "   Ziel: backups/20250902_supabase_final.sql"
echo "   Format: Plain SQL (für RDS Import optimiert)"
echo ""

# Create the backup
pg_dump --no-owner --no-privileges \
  --dbname="$CONNECTION_URL" \
  --format=plain \
  --file=backups/20250902_supabase_final.sql

if [ $? -eq 0 ]; then
  echo "✅ Backup erfolgreich erstellt!"
  
  # Show backup info
  BACKUP_SIZE=$(wc -l < backups/20250902_supabase_final.sql)
  BACKUP_FILE_SIZE=$(ls -lh backups/20250902_supabase_final.sql | awk '{print $5}')
  
  echo "📊 Backup-Statistiken:"
  echo "   Datei: backups/20250902_supabase_final.sql"
  echo "   Zeilen: $BACKUP_SIZE"
  echo "   Größe: $BACKUP_FILE_SIZE"
  echo ""
  
  # Show first few lines to verify
  echo "🔍 Backup-Vorschau (erste 10 Zeilen):"
  head -10 backups/20250902_supabase_final.sql
  echo "..."
  echo ""
  
  echo "✅ SCHRITT 1 ABGESCHLOSSEN!"
  echo "🚀 Nächster Schritt: RDS Import vorbereiten"
  echo "   Führe aus: ./scripts/task-12-2-rds-import.sh"
  
else
  echo "❌ Fehler beim Erstellen des Backups!"
  echo "💡 Mögliche Ursachen:"
  echo "   • Falsches Passwort"
  echo "   • Netzwerkverbindung"
  echo "   • pg_dump nicht installiert"
  echo ""
  echo "🔧 Debugging:"
  echo "   Teste Verbindung: psql '$CONNECTION_URL' -c 'SELECT 1;'"
  exit 1
fi