#!/bin/bash
set -euo pipefail

# Generate Sample Users CSV for Migration Testing
# Creates realistic test data for user migration validation

echo "📊 Generating Sample Users CSV for Migration Testing"
echo "==================================================="

# Generate sample users CSV
cat > users.csv << 'EOF'
id,email,given_name,family_name,phone,role,locale,created_at,updated_at,profile_complete,onboarding_step
550e8400-e29b-41d4-a716-446655440001,max.mustermann@restaurant-berlin.de,Max,Mustermann,+491234567890,owner,de,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z,true,3
550e8400-e29b-41d4-a716-446655440002,anna.schmidt@bistro-hamburg.de,Anna,Schmidt,+491234567891,owner,de,2024-01-16T11:15:00Z,2024-01-16T11:15:00Z,false,1
550e8400-e29b-41d4-a716-446655440003,thomas.weber@pizzeria-muenchen.de,Thomas,Weber,+491234567892,owner,de,2024-01-17T09:45:00Z,2024-01-17T09:45:00Z,true,4
550e8400-e29b-41d4-a716-446655440004,maria.garcia@tapas-koeln.de,Maria,Garcia,+491234567893,owner,de,2024-01-18T14:20:00Z,2024-01-18T14:20:00Z,false,2
550e8400-e29b-41d4-a716-446655440005,jean.dubois@brasserie-frankfurt.de,Jean,Dubois,+491234567894,owner,de,2024-01-19T16:30:00Z,2024-01-19T16:30:00Z,true,5
550e8400-e29b-41d4-a716-446655440006,lisa.johnson@cafe-stuttgart.de,Lisa,Johnson,+491234567895,owner,en,2024-01-20T08:15:00Z,2024-01-20T08:15:00Z,false,1
550e8400-e29b-41d4-a716-446655440007,marco.rossi@trattoria-duesseldorf.de,Marco,Rossi,+491234567896,owner,de,2024-01-21T12:45:00Z,2024-01-21T12:45:00Z,true,3
550e8400-e29b-41d4-a716-446655440008,sophie.martin@restaurant-bremen.de,Sophie,Martin,+491234567897,owner,de,2024-01-22T15:10:00Z,2024-01-22T15:10:00Z,false,2
550e8400-e29b-41d4-a716-446655440009,ahmed.hassan@orient-hannover.de,Ahmed,Hassan,+491234567898,owner,de,2024-01-23T11:30:00Z,2024-01-23T11:30:00Z,true,4
550e8400-e29b-41d4-a716-446655440010,yuki.tanaka@sushi-leipzig.de,Yuki,Tanaka,+491234567899,owner,de,2024-01-24T13:20:00Z,2024-01-24T13:20:00Z,false,1
550e8400-e29b-41d4-a716-446655440011,carlos.rodriguez@mexican-dresden.de,Carlos,Rodriguez,+491234567800,owner,de,2024-01-25T10:00:00Z,2024-01-25T10:00:00Z,true,5
550e8400-e29b-41d4-a716-446655440012,elena.petrov@balkan-nuernberg.de,Elena,Petrov,+491234567801,owner,de,2024-01-26T14:45:00Z,2024-01-26T14:45:00Z,false,2
550e8400-e29b-41d4-a716-446655440013,raj.patel@curry-dortmund.de,Raj,Patel,+491234567802,owner,en,2024-01-27T09:30:00Z,2024-01-27T09:30:00Z,true,3
550e8400-e29b-41d4-a716-446655440014,fatima.al-zahra@libanon-essen.de,Fatima,Al-Zahra,+491234567803,owner,de,2024-01-28T16:15:00Z,2024-01-28T16:15:00Z,false,1
550e8400-e29b-41d4-a716-446655440015,dimitri.kostas@taverna-bochum.de,Dimitri,Kostas,+491234567804,owner,de,2024-01-29T12:00:00Z,2024-01-29T12:00:00Z,true,4
550e8400-e29b-41d4-a716-446655440016,ingrid.larsson@nordic-wuppertal.de,Ingrid,Larsson,+491234567805,owner,en,2024-01-30T11:45:00Z,2024-01-30T11:45:00Z,false,2
550e8400-e29b-41d4-a716-446655440017,antonio.silva@churrasqueria-bielefeld.de,Antonio,Silva,+491234567806,owner,de,2024-01-31T15:30:00Z,2024-01-31T15:30:00Z,true,5
550e8400-e29b-41d4-a716-446655440018,kim.lee@korean-bonn.de,Kim,Lee,+491234567807,owner,de,2024-02-01T10:15:00Z,2024-02-01T10:15:00Z,false,1
550e8400-e29b-41d4-a716-446655440019,olga.volkov@russian-mannheim.de,Olga,Volkov,+491234567808,owner,de,2024-02-02T13:45:00Z,2024-02-02T13:45:00Z,true,3
550e8400-e29b-41d4-a716-446655440020,hassan.omar@marokko-karlsruhe.de,Hassan,Omar,+491234567809,owner,de,2024-02-03T14:30:00Z,2024-02-03T14:30:00Z,false,2
550e8400-e29b-41d4-a716-446655440021,test.duplicate@restaurant-berlin.de,Test,Duplicate,+491234567810,owner,de,2024-02-04T09:00:00Z,2024-02-04T09:00:00Z,true,1
550e8400-e29b-41d4-a716-446655440022,invalid-email-format,Invalid,Email,,owner,de,2024-02-05T10:00:00Z,2024-02-05T10:00:00Z,false,0
550e8400-e29b-41d4-a716-446655440023,max.mustermann@restaurant-berlin.de,Max,Mustermann,+491234567890,owner,de,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z,true,3
550e8400-e29b-41d4-a716-446655440024,complete.user@full-data.de,Complete,User,+491234567811,owner,de,2024-02-06T11:00:00Z,2024-02-06T11:00:00Z,true,5
550e8400-e29b-41d4-a716-446655440025,minimal.user@minimal-data.de,,,,,de,2024-02-07T12:00:00Z,2024-02-07T12:00:00Z,false,0
EOF

echo "✅ Sample users CSV generated: users.csv"
echo ""
echo "📊 Sample Data Summary:"
echo "======================"
echo "Total Records: 25"
echo "Valid Users: 23"
echo "Invalid Email: 1 (invalid-email-format)"
echo "Duplicate Email: 1 (max.mustermann@restaurant-berlin.de)"
echo ""
echo "Test Cases Included:"
echo "- Complete user profiles with all fields"
echo "- Minimal user profiles (email only)"
echo "- International names and restaurants"
echo "- Different locales (de/en)"
echo "- Various onboarding steps (0-5)"
echo "- Phone number formatting variations"
echo "- Invalid email format (for error testing)"
echo "- Duplicate email (for duplicate handling testing)"
echo ""
echo "🚀 Ready to run migration test:"
echo "   ./user-data-migration.sh"
echo ""