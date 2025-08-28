just zur info. ich gib dir im anschluss die supabase datei

| table_name                      | pos | name                       | type                        | is_nullable | column_default                               |
| ------------------------------- | --- | -------------------------- | --------------------------- | ----------- | -------------------------------------------- |
| addon_services                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| addon_services                  | 2   | name                       | text                        | NO          | null                                         |
| addon_services                  | 3   | slug                       | text                        | NO          | null                                         |
| addon_services                  | 4   | description                | text                        | YES         | null                                         |
| addon_services                  | 5   | price                      | numeric                     | NO          | null                                         |
| addon_services                  | 6   | original_price             | numeric                     | YES         | null                                         |
| addon_services                  | 7   | period                     | text                        | NO          | 'monthly'::text                              |
| addon_services                  | 8   | category                   | text                        | NO          | null                                         |
| addon_services                  | 9   | requires_base_package      | boolean                     | YES         | true                                         |
| addon_services                  | 10  | compatible_packages        | ARRAY                       | YES         | '{}'::text[]                                 |
| addon_services                  | 11  | features                   | ARRAY                       | YES         | '{}'::text[]                                 |
| addon_services                  | 12  | name_translations          | jsonb                       | YES         | '{}'::jsonb                                  |
| addon_services                  | 13  | description_translations   | jsonb                       | YES         | '{}'::jsonb                                  |
| addon_services                  | 14  | features_translations      | jsonb                       | YES         | '{}'::jsonb                                  |
| addon_services                  | 15  | is_active                  | boolean                     | YES         | true                                         |
| addon_services                  | 16  | sort_order                 | integer                     | YES         | 0                                            |
| addon_services                  | 17  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| addon_services                  | 18  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| admin_booking_kpis              | 1   | total_bookings             | bigint                      | YES         | null                                         |
| admin_booking_kpis              | 2   | new_partners_today         | bigint                      | YES         | null                                         |
| admin_booking_kpis              | 3   | cancellations              | bigint                      | YES         | null                                         |
| admin_booking_kpis              | 4   | conversion_rate            | numeric                     | YES         | null                                         |
| admin_booking_metrics_by_month  | 1   | month                      | timestamp with time zone    | YES         | null                                         |
| admin_booking_metrics_by_month  | 2   | active_bookings            | bigint                      | YES         | null                                         |
| admin_booking_metrics_by_month  | 3   | cancelled_bookings         | bigint                      | YES         | null                                         |
| admin_booking_metrics_by_month  | 4   | unique_partners            | bigint                      | YES         | null                                         |
| admin_booking_revenue_analytics | 1   | month                      | timestamp with time zone    | YES         | null                                         |
| admin_booking_revenue_analytics | 2   | service_type               | text                        | YES         | null                                         |
| admin_booking_revenue_analytics | 3   | total_bookings             | bigint                      | YES         | null                                         |
| admin_booking_revenue_analytics | 4   | active_bookings            | bigint                      | YES         | null                                         |
| admin_booking_revenue_analytics | 5   | cancelled_bookings         | bigint                      | YES         | null                                         |
| admin_booking_revenue_analytics | 6   | total_revenue              | numeric                     | YES         | null                                         |
| admin_booking_revenue_analytics | 7   | active_revenue             | numeric                     | YES         | null                                         |
| admin_booking_revenue_analytics | 8   | avg_booking_value          | numeric                     | YES         | null                                         |
| admin_booking_revenue_analytics | 9   | unique_partners            | bigint                      | YES         | null                                         |
| ai_recommendations              | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| ai_recommendations              | 2   | partner_id                 | uuid                        | NO          | null                                         |
| ai_recommendations              | 3   | recommendation_type        | text                        | NO          | null                                         |
| ai_recommendations              | 4   | title                      | text                        | NO          | null                                         |
| ai_recommendations              | 5   | description                | text                        | NO          | null                                         |
| ai_recommendations              | 6   | priority                   | text                        | YES         | 'medium'::text                               |
| ai_recommendations              | 7   | status                     | text                        | YES         | 'pending'::text                              |
| ai_recommendations              | 8   | metadata                   | jsonb                       | YES         | '{}'::jsonb                                  |
| ai_recommendations              | 9   | estimated_impact           | text                        | YES         | null                                         |
| ai_recommendations              | 10  | implementation_difficulty  | text                        | YES         | 'medium'::text                               |
| ai_recommendations              | 11  | expires_at                 | timestamp with time zone    | YES         | null                                         |
| ai_recommendations              | 12  | completed_at               | timestamp with time zone    | YES         | null                                         |
| ai_recommendations              | 13  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| ai_recommendations              | 14  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| alerts                          | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| alerts                          | 2   | partner_id                 | uuid                        | YES         | null                                         |
| alerts                          | 3   | user_id                    | uuid                        | YES         | null                                         |
| alerts                          | 4   | category                   | uuid                        | YES         | null                                         |
| alerts                          | 5   | type                       | text                        | YES         | null                                         |
| alerts                          | 6   | message                    | text                        | YES         | null                                         |
| alerts                          | 7   | sent_at                    | timestamp with time zone    | YES         | now()                                        |
| alerts                          | 8   | status                     | text                        | YES         | 'pending'::text                              |
| auto_tagging_jobs               | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| auto_tagging_jobs               | 2   | run_started_at             | timestamp with time zone    | NO          | now()                                        |
| auto_tagging_jobs               | 3   | run_finished_at            | timestamp with time zone    | YES         | null                                         |
| auto_tagging_jobs               | 4   | total_categories_processed | integer                     | YES         | 0                                            |
| auto_tagging_jobs               | 5   | total_tags_created         | integer                     | YES         | 0                                            |
| auto_tagging_jobs               | 6   | status                     | text                        | YES         | 'running'::text                              |
| auto_tagging_jobs               | 7   | error_message              | text                        | YES         | null                                         |
| billing_events                  | 1   | partner_id                 | uuid                        | YES         | null                                         |
| billing_events                  | 2   | event                      | text                        | YES         | null                                         |
| billing_events                  | 3   | created_at                 | timestamp without time zone | YES         | now()                                        |
| business_contact_data           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| business_contact_data           | 2   | customer_id                | uuid                        | NO          | null                                         |
| business_contact_data           | 3   | company_name               | text                        | NO          | null                                         |
| business_contact_data           | 4   | address_line1              | text                        | NO          | null                                         |
| business_contact_data           | 5   | house_number               | text                        | NO          | null                                         |
| business_contact_data           | 6   | address_line2              | text                        | YES         | null                                         |
| business_contact_data           | 7   | postal_code                | text                        | NO          | null                                         |
| business_contact_data           | 8   | city                       | text                        | NO          | null                                         |
| business_contact_data           | 9   | region                     | text                        | YES         | null                                         |
| business_contact_data           | 10  | country                    | text                        | NO          | null                                         |
| business_contact_data           | 11  | contact_email              | text                        | NO          | null                                         |
| business_contact_data           | 12  | contact_phone              | text                        | NO          | null                                         |
| business_contact_data           | 13  | contact_website            | text                        | YES         | null                                         |
| business_contact_data           | 14  | socials                    | jsonb                       | YES         | '{}'::jsonb                                  |
| business_contact_data           | 15  | competitors                | jsonb                       | YES         | '[]'::jsonb                                  |
| business_contact_data           | 16  | data_source                | text                        | NO          | 'user_input'::text                           |
| business_contact_data           | 17  | verified                   | boolean                     | NO          | false                                        |
| business_contact_data           | 18  | last_enriched_at           | timestamp with time zone    | YES         | null                                         |
| business_contact_data           | 19  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| business_contact_data           | 20  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| business_partners               | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| business_partners               | 2   | user_id                    | uuid                        | YES         | null                                         |
| business_partners               | 3   | company_name               | text                        | NO          | null                                         |
| business_partners               | 4   | contact_email              | text                        | YES         | null                                         |
| business_partners               | 5   | contact_phone              | text                        | YES         | null                                         |
| business_partners               | 6   | website                    | text                        | YES         | null                                         |
| business_partners               | 7   | address                    | text                        | YES         | null                                         |
| business_partners               | 8   | tax_id                     | text                        | YES         | null                                         |
| business_partners               | 9   | status                     | text                        | YES         | 'pending'::text                              |
| business_partners               | 10  | services_selected          | ARRAY                       | YES         | '{}'::text[]                                 |
| business_partners               | 11  | onboarding_completed       | boolean                     | YES         | false                                        |
| business_partners               | 12  | document_uploaded          | boolean                     | YES         | false                                        |
| business_partners               | 13  | profile_verified           | boolean                     | YES         | false                                        |
| business_partners               | 14  | billing_address            | jsonb                       | YES         | null                                         |
| business_partners               | 15  | notes                      | text                        | YES         | null                                         |
| business_partners               | 16  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| business_partners               | 17  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| business_partners               | 18  | google_account_id          | text                        | YES         | null                                         |
| business_partners               | 19  | category_ids               | ARRAY                       | YES         | null                                         |
| business_partners               | 20  | description                | text                        | YES         | null                                         |
| business_partners               | 21  | special_features           | jsonb                       | YES         | null                                         |
| business_partners               | 22  | location                   | point                       | YES         | null                                         |
| business_partners               | 23  | categories                 | jsonb                       | YES         | '[]'::jsonb                                  |
| business_partners               | 24  | business_model             | ARRAY                       | YES         | null                                         |
| business_partners               | 25  | revenue_streams            | ARRAY                       | YES         | null                                         |
| business_partners               | 26  | target_audience            | ARRAY                       | YES         | null                                         |
| business_partners               | 27  | seating_capacity           | integer                     | YES         | null                                         |
| business_partners               | 28  | opening_hours              | ARRAY                       | YES         | null                                         |
| business_partners               | 29  | go_live                    | boolean                     | YES         | false                                        |
| business_partners               | 30  | google_connected           | boolean                     | YES         | false                                        |
| business_profiles               | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| business_profiles               | 2   | user_id                    | uuid                        | NO          | null                                         |
| business_profiles               | 3   | registration_type          | text                        | YES         | null                                         |
| business_profiles               | 4   | company_name               | text                        | NO          | null                                         |
| business_profiles               | 5   | address                    | text                        | YES         | null                                         |
| business_profiles               | 6   | phone                      | text                        | YES         | null                                         |
| business_profiles               | 7   | website                    | text                        | YES         | null                                         |
| business_profiles               | 8   | email                      | text                        | YES         | null                                         |
| business_profiles               | 9   | description                | text                        | YES         | null                                         |
| business_profiles               | 10  | categories                 | ARRAY                       | YES         | '{}'::text[]                                 |
| business_profiles               | 11  | business_hours             | jsonb                       | YES         | '{}'::jsonb                                  |
| business_profiles               | 12  | services                   | ARRAY                       | YES         | '{}'::text[]                                 |
| business_profiles               | 13  | target_audience            | ARRAY                       | YES         | '{}'::text[]                                 |
| business_profiles               | 14  | google_places_id           | text                        | YES         | null                                         |
| business_profiles               | 15  | gmb_verification_status    | text                        | YES         | null                                         |
| business_profiles               | 16  | google_reviews_count       | integer                     | YES         | 0                                            |
| business_profiles               | 17  | google_rating              | numeric                     | YES         | null                                         |
| business_profiles               | 18  | google_photos              | jsonb                       | YES         | '[]'::jsonb                                  |
| business_profiles               | 19  | gmb_social_links           | jsonb                       | YES         | '{}'::jsonb                                  |
| business_profiles               | 20  | gmb_attributes             | jsonb                       | YES         | '{}'::jsonb                                  |
| business_profiles               | 21  | gmb_posts                  | jsonb                       | YES         | '[]'::jsonb                                  |
| business_profiles               | 22  | facebook_page_id           | text                        | YES         | null                                         |
| business_profiles               | 23  | instagram_handle           | text                        | YES         | null                                         |
| business_profiles               | 24  | instagram_business_id      | text                        | YES         | null                                         |
| business_profiles               | 25  | facebook_followers         | integer                     | YES         | 0                                            |
| business_profiles               | 26  | instagram_followers        | integer                     | YES         | 0                                            |
| business_profiles               | 27  | facebook_posts_count       | integer                     | YES         | 0                                            |
| business_profiles               | 28  | whatsapp_number            | text                        | YES         | null                                         |
| business_profiles               | 29  | messenger_integration      | boolean                     | YES         | false                                        |
| business_profiles               | 30  | facebook_page_category     | text                        | YES         | null                                         |
| business_profiles               | 31  | facebook_about             | text                        | YES         | null                                         |
| business_profiles               | 32  | vc_completed               | boolean                     | YES         | false                                        |
| business_profiles               | 33  | vc_score                   | integer                     | YES         | null                                         |
| business_profiles               | 34  | vc_last_run                | timestamp with time zone    | YES         | null                                         |
| business_profiles               | 35  | vc_results                 | jsonb                       | YES         | '{}'::jsonb                                  |
| business_profiles               | 36  | onboarding_completed       | boolean                     | YES         | false                                        |
| business_profiles               | 37  | profile_verified           | boolean                     | YES         | false                                        |
| business_profiles               | 38  | data_sources               | ARRAY                       | YES         | '{}'::text[]                                 |
| business_profiles               | 39  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| business_profiles               | 40  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| business_profiles               | 41  | tax_number                 | text                        | YES         | null                                         |
| business_profiles               | 42  | vat_id                     | text                        | YES         | null                                         |
| business_profiles               | 43  | legal_entity               | text                        | YES         | null                                         |
| business_profiles               | 44  | commercial_register        | text                        | YES         | null                                         |
| business_profiles               | 45  | bank_account               | text                        | YES         | null                                         |
| business_profiles               | 46  | owner_name                 | text                        | YES         | null                                         |
| business_profiles               | 47  | business_license           | text                        | YES         | null                                         |
| business_profiles               | 48  | payment_methods            | ARRAY                       | YES         | null                                         |
| business_profiles               | 49  | paypal_email               | text                        | YES         | null                                         |
| business_profiles               | 50  | stripe_account             | text                        | YES         | null                                         |
| business_profiles               | 51  | subscription               | text                        | YES         | 'free'::text                                 |
| business_profiles               | 52  | street                     | text                        | YES         | null                                         |
| business_profiles               | 53  | house_number               | text                        | YES         | null                                         |
| business_profiles               | 54  | address_line2              | text                        | YES         | null                                         |
| business_profiles               | 55  | postal_code                | text                        | YES         | null                                         |
| business_profiles               | 56  | city                       | text                        | YES         | null                                         |
| business_profiles               | 57  | country                    | text                        | YES         | 'Deutschland'::text                          |
| business_profiles               | 58  | card_number                | text                        | YES         | null                                         |
| business_profiles               | 59  | card_expiry                | text                        | YES         | null                                         |
| business_profiles               | 60  | card_cvc                   | text                        | YES         | null                                         |
| business_profiles               | 61  | google_connected           | boolean                     | NO          | false                                        |
| category_cross_tags             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| category_cross_tags             | 2   | category_id                | uuid                        | NO          | null                                         |
| category_cross_tags             | 3   | target_main_category       | text                        | NO          | null                                         |
| category_cross_tags             | 4   | confidence_score           | numeric                     | YES         | 1.0                                          |
| category_cross_tags             | 5   | source                     | text                        | NO          | null                                         |
| category_cross_tags             | 6   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| category_cross_tags             | 7   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| category_cross_tags             | 8   | target_main_category_id    | uuid                        | YES         | null                                         |
| category_search_logs            | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| category_search_logs            | 2   | user_id                    | uuid                        | YES         | null                                         |
| category_search_logs            | 3   | search_term                | text                        | NO          | null                                         |
| category_search_logs            | 4   | selected_main_categories   | ARRAY                       | NO          | null                                         |
| category_search_logs            | 5   | search_timestamp           | timestamp with time zone    | NO          | now()                                        |
| category_search_logs            | 6   | result_category_ids        | ARRAY                       | YES         | null                                         |
| category_search_logs            | 7   | selected_category_id       | uuid                        | YES         | null                                         |
| category_specifics              | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| category_specifics              | 2   | partner_id                 | uuid                        | YES         | null                                         |
| category_specifics              | 3   | category_id                | uuid                        | YES         | null                                         |
| category_specifics              | 4   | key                        | text                        | NO          | null                                         |
| category_specifics              | 5   | value                      | text                        | YES         | null                                         |
| category_specifics              | 6   | created_at                 | timestamp without time zone | YES         | now()                                        |
| category_tag_events             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| category_tag_events             | 2   | category_cross_tag_id      | uuid                        | YES         | null                                         |
| category_tag_events             | 3   | changed_by                 | uuid                        | YES         | null                                         |
| category_tag_events             | 4   | change_type                | text                        | YES         | null                                         |
| category_tag_events             | 5   | old_confidence             | numeric                     | YES         | null                                         |
| category_tag_events             | 6   | new_confidence             | numeric                     | YES         | null                                         |
| category_tag_events             | 7   | old_source                 | text                        | YES         | null                                         |
| category_tag_events             | 8   | new_source                 | text                        | YES         | null                                         |
| category_tag_events             | 9   | event_timestamp            | timestamp with time zone    | NO          | now()                                        |
| category_tag_events             | 10  | comment                    | text                        | YES         | null                                         |
| competitive_analysis            | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| competitive_analysis            | 2   | lead_id                    | uuid                        | NO          | null                                         |
| competitive_analysis            | 3   | competitor_name            | text                        | NO          | null                                         |
| competitive_analysis            | 4   | competitor_url             | text                        | YES         | null                                         |
| competitive_analysis            | 5   | platform                   | text                        | NO          | null                                         |
| competitive_analysis            | 6   | competitor_score           | numeric                     | YES         | null                                         |
| competitive_analysis            | 7   | our_score                  | numeric                     | YES         | null                                         |
| competitive_analysis            | 8   | gap_analysis               | jsonb                       | YES         | '{}'::jsonb                                  |
| competitive_analysis            | 9   | recommendations            | ARRAY                       | YES         | null                                         |
| competitive_analysis            | 10  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| competitive_analysis            | 11  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| consultation_requests           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| consultation_requests           | 2   | email                      | text                        | NO          | null                                         |
| consultation_requests           | 3   | company_name               | text                        | YES         | null                                         |
| consultation_requests           | 4   | contact_person             | text                        | YES         | null                                         |
| consultation_requests           | 5   | phone                      | text                        | YES         | null                                         |
| consultation_requests           | 6   | preferred_time             | text                        | YES         | null                                         |
| consultation_requests           | 7   | preferred_date             | date                        | YES         | null                                         |
| consultation_requests           | 8   | message                    | text                        | YES         | null                                         |
| consultation_requests           | 9   | service_interest           | ARRAY                       | YES         | null                                         |
| consultation_requests           | 10  | status                     | text                        | YES         | 'new'::text                                  |
| consultation_requests           | 11  | assigned_to                | uuid                        | YES         | null                                         |
| consultation_requests           | 12  | notes                      | text                        | YES         | null                                         |
| consultation_requests           | 13  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| consultation_requests           | 14  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| dudle_options                   | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| dudle_options                   | 2   | session_id                 | uuid                        | NO          | null                                         |
| dudle_options                   | 3   | restaurant_id              | uuid                        | YES         | null                                         |
| dudle_options                   | 4   | option_text                | text                        | YES         | null                                         |
| dudle_options                   | 5   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| dudle_participants              | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| dudle_participants              | 2   | session_id                 | uuid                        | NO          | null                                         |
| dudle_participants              | 3   | email                      | text                        | NO          | null                                         |
| dudle_participants              | 4   | user_id                    | uuid                        | YES         | null                                         |
| dudle_participants              | 5   | invited_at                 | timestamp with time zone    | YES         | now()                                        |
| dudle_participants              | 6   | responded_at               | timestamp with time zone    | YES         | null                                         |
| dudle_sessions                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| dudle_sessions                  | 2   | creator_id                 | uuid                        | NO          | null                                         |
| dudle_sessions                  | 3   | title                      | text                        | NO          | null                                         |
| dudle_sessions                  | 4   | description                | text                        | YES         | null                                         |
| dudle_sessions                  | 5   | status                     | text                        | YES         | 'active'::text                               |
| dudle_sessions                  | 6   | expires_at                 | timestamp with time zone    | YES         | null                                         |
| dudle_sessions                  | 7   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| dudle_sessions                  | 8   | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| dudle_votes                     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| dudle_votes                     | 2   | session_id                 | uuid                        | NO          | null                                         |
| dudle_votes                     | 3   | option_id                  | uuid                        | NO          | null                                         |
| dudle_votes                     | 4   | participant_id             | uuid                        | YES         | null                                         |
| dudle_votes                     | 5   | user_id                    | uuid                        | YES         | null                                         |
| dudle_votes                     | 6   | vote_value                 | integer                     | YES         | null                                         |
| dudle_votes                     | 7   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| facebook_data_cache             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| facebook_data_cache             | 2   | user_id                    | uuid                        | NO          | null                                         |
| facebook_data_cache             | 3   | facebook_page_id           | text                        | YES         | null                                         |
| facebook_data_cache             | 4   | instagram_business_id      | text                        | YES         | null                                         |
| facebook_data_cache             | 5   | facebook_user_id           | text                        | YES         | null                                         |
| facebook_data_cache             | 6   | page_data                  | jsonb                       | YES         | '{}'::jsonb                                  |
| facebook_data_cache             | 7   | posts_data                 | jsonb                       | YES         | '{}'::jsonb                                  |
| facebook_data_cache             | 8   | insights_data              | jsonb                       | YES         | '{}'::jsonb                                  |
| facebook_data_cache             | 9   | instagram_data             | jsonb                       | YES         | '{}'::jsonb                                  |
| facebook_data_cache             | 10  | followers_data             | jsonb                       | YES         | '{}'::jsonb                                  |
| facebook_data_cache             | 11  | last_fetched               | timestamp with time zone    | YES         | now()                                        |
| facebook_data_cache             | 12  | cache_expires_at           | timestamp with time zone    | YES         | (now() + '06:00:00'::interval)               |
| facebook_data_cache             | 13  | api_calls_count            | integer                     | YES         | 0                                            |
| facebook_data_cache             | 14  | fetch_errors               | jsonb                       | YES         | '[]'::jsonb                                  |
| facebook_data_cache             | 15  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| facebook_data_cache             | 16  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| facebook_oauth_tokens           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| facebook_oauth_tokens           | 2   | user_id                    | uuid                        | NO          | null                                         |
| facebook_oauth_tokens           | 3   | facebook_user_id           | text                        | NO          | null                                         |
| facebook_oauth_tokens           | 4   | access_token               | text                        | NO          | null                                         |
| facebook_oauth_tokens           | 5   | email                      | text                        | YES         | null                                         |
| facebook_oauth_tokens           | 6   | scopes                     | ARRAY                       | YES         | ARRAY['public_profile'::text, 'email'::text] |
| facebook_oauth_tokens           | 7   | consent_given              | boolean                     | NO          | true                                         |
| facebook_oauth_tokens           | 8   | consent_timestamp          | timestamp with time zone    | NO          | now()                                        |
| facebook_oauth_tokens           | 9   | expires_at                 | timestamp with time zone    | YES         | null                                         |
| facebook_oauth_tokens           | 10  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| facebook_oauth_tokens           | 11  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| facebook_webhook_events         | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| facebook_webhook_events         | 2   | event_type                 | text                        | NO          | null                                         |
| facebook_webhook_events         | 3   | object_type                | text                        | NO          | null                                         |
| facebook_webhook_events         | 4   | object_id                  | text                        | YES         | null                                         |
| facebook_webhook_events         | 5   | raw_payload                | jsonb                       | NO          | '{}'::jsonb                                  |
| facebook_webhook_events         | 6   | processing_status          | text                        | NO          | 'pending'::text                              |
| facebook_webhook_events         | 7   | error_message              | text                        | YES         | null                                         |
| facebook_webhook_events         | 8   | retry_count                | integer                     | NO          | 0                                            |
| facebook_webhook_events         | 9   | processed_at               | timestamp with time zone    | YES         | null                                         |
| facebook_webhook_events         | 10  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| facebook_webhook_events         | 11  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| fb_conversion_logs              | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| fb_conversion_logs              | 2   | partner_id                 | uuid                        | YES         | null                                         |
| fb_conversion_logs              | 3   | user_id                    | uuid                        | YES         | null                                         |
| fb_conversion_logs              | 4   | event_name                 | text                        | NO          | null                                         |
| fb_conversion_logs              | 5   | pixel_id                   | text                        | NO          | null                                         |
| fb_conversion_logs              | 6   | event_payload              | jsonb                       | NO          | null                                         |
| fb_conversion_logs              | 7   | response_status            | integer                     | YES         | null                                         |
| fb_conversion_logs              | 8   | response_body              | jsonb                       | YES         | null                                         |
| fb_conversion_logs              | 9   | error_message              | text                        | YES         | null                                         |
| fb_conversion_logs              | 10  | sent_at                    | timestamp with time zone    | YES         | now()                                        |
| fb_conversion_logs              | 11  | success                    | boolean                     | YES         | false                                        |
| fb_conversions_config           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| fb_conversions_config           | 2   | partner_id                 | uuid                        | YES         | null                                         |
| fb_conversions_config           | 3   | pixel_id                   | text                        | NO          | null                                         |
| fb_conversions_config           | 4   | access_token               | text                        | NO          | null                                         |
| fb_conversions_config           | 5   | is_active                  | boolean                     | YES         | true                                         |
| fb_conversions_config           | 6   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| fb_conversions_config           | 7   | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| ga4_daily                       | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| ga4_daily                       | 2   | partner_id                 | uuid                        | NO          | null                                         |
| ga4_daily                       | 3   | date                       | date                        | NO          | null                                         |
| ga4_daily                       | 4   | sessions                   | integer                     | YES         | 0                                            |
| ga4_daily                       | 5   | page_views                 | integer                     | YES         | 0                                            |
| ga4_daily                       | 6   | unique_users               | integer                     | YES         | 0                                            |
| ga4_daily                       | 7   | bounce_rate                | numeric                     | YES         | 0.0                                          |
| ga4_daily                       | 8   | avg_session_duration       | numeric                     | YES         | 0.0                                          |
| ga4_daily                       | 9   | conversions                | integer                     | YES         | 0                                            |
| ga4_daily                       | 10  | conversion_rate            | numeric                     | YES         | 0.0                                          |
| ga4_daily                       | 11  | top_pages                  | jsonb                       | YES         | '[]'::jsonb                                  |
| ga4_daily                       | 12  | top_queries                | jsonb                       | YES         | '[]'::jsonb                                  |
| ga4_daily                       | 13  | traffic_sources            | jsonb                       | YES         | '{}'::jsonb                                  |
| ga4_daily                       | 14  | device_breakdown           | jsonb                       | YES         | '{}'::jsonb                                  |
| ga4_daily                       | 15  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| ga4_daily                       | 16  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| gmb_categories                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| gmb_categories                  | 2   | category_id                | text                        | NO          | null                                         |
| gmb_categories                  | 3   | name_de                    | text                        | NO          | null                                         |
| gmb_categories                  | 4   | name_en                    | text                        | NO          | null                                         |
| gmb_categories                  | 5   | is_popular                 | boolean                     | NO          | false                                        |
| gmb_categories                  | 6   | sort_order                 | integer                     | NO          | 0                                            |
| gmb_categories                  | 7   | parent_category_id         | text                        | YES         | null                                         |
| gmb_categories                  | 8   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| gmb_categories                  | 9   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| gmb_categories                  | 10  | is_primary                 | boolean                     | YES         | false                                        |
| gmb_categories                  | 11  | parent_id                  | text                        | YES         | null                                         |
| gmb_categories                  | 12  | category_path              | text                        | YES         | null                                         |
| gmb_categories                  | 13  | synonyms                   | ARRAY                       | YES         | null                                         |
| gmb_categories                  | 14  | country_availability       | ARRAY                       | YES         | '{DE,AT,CH}'::text[]                         |
| gmb_categories                  | 15  | description_de             | text                        | YES         | null                                         |
| gmb_categories                  | 16  | keywords                   | ARRAY                       | YES         | null                                         |
| gmb_categories                  | 17  | description_en             | text                        | YES         | null                                         |
| gmb_categories                  | 18  | public_id                  | numeric                     | YES         | null                                         |
| gmb_categories                  | 19  | haupt_kategorie            | text                        | YES         | null                                         |
| gmb_categories                  | 20  | main_category              | text                        | YES         | null                                         |
| gmb_categories                  | 21  | main_category_id           | uuid                        | YES         | null                                         |
| gmb_categories_backup           | 1   | category_id                | text                        | YES         | null                                         |
| gmb_categories_backup           | 2   | name_en                    | text                        | YES         | null                                         |
| gmb_categories_backup           | 3   | name_de                    | text                        | YES         | null                                         |
| gmb_categories_backup           | 4   | is_popular                 | boolean                     | YES         | null                                         |
| gmb_categories_backup           | 5   | is_primary                 | boolean                     | YES         | null                                         |
| gmb_categories_backup           | 6   | sort_order                 | integer                     | YES         | null                                         |
| gmb_categories_backup           | 7   | parent_category_id         | text                        | YES         | null                                         |
| gmb_categories_backup           | 8   | category_path              | text                        | YES         | null                                         |
| gmb_categories_backup           | 9   | country_availability       | ARRAY                       | YES         | null                                         |
| gmb_categories_backup           | 10  | description                | text                        | YES         | null                                         |
| gmb_categories_backup           | 11  | keywords                   | ARRAY                       | YES         | null                                         |
| gmb_categories_backup           | 12  | synonyms                   | ARRAY                       | YES         | null                                         |
| gmb_categories_backup           | 13  | created_at                 | timestamp with time zone    | YES         | null                                         |
| gmb_categories_backup           | 14  | updated_at                 | timestamp with time zone    | YES         | null                                         |
| gmb_data_cache                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| gmb_data_cache                  | 2   | user_id                    | uuid                        | NO          | null                                         |
| gmb_data_cache                  | 3   | google_places_id           | text                        | YES         | null                                         |
| gmb_data_cache                  | 4   | google_user_id             | text                        | YES         | null                                         |
| gmb_data_cache                  | 5   | business_data              | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 6   | reviews_data               | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 7   | photos_data                | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 8   | posts_data                 | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 9   | attributes_data            | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 10  | insights_data              | jsonb                       | YES         | '{}'::jsonb                                  |
| gmb_data_cache                  | 11  | last_fetched               | timestamp with time zone    | YES         | now()                                        |
| gmb_data_cache                  | 12  | cache_expires_at           | timestamp with time zone    | YES         | (now() + '24:00:00'::interval)               |
| gmb_data_cache                  | 13  | api_calls_count            | integer                     | YES         | 0                                            |
| gmb_data_cache                  | 14  | fetch_errors               | jsonb                       | YES         | '[]'::jsonb                                  |
| gmb_data_cache                  | 15  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| gmb_data_cache                  | 16  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| gmb_profiles                    | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| gmb_profiles                    | 2   | partner_id                 | uuid                        | NO          | null                                         |
| gmb_profiles                    | 3   | snapshot_date              | date                        | NO          | CURRENT_DATE                                 |
| gmb_profiles                    | 4   | google_location_id         | text                        | YES         | null                                         |
| gmb_profiles                    | 5   | business_name              | text                        | YES         | null                                         |
| gmb_profiles                    | 6   | address                    | text                        | YES         | null                                         |
| gmb_profiles                    | 7   | phone                      | text                        | YES         | null                                         |
| gmb_profiles                    | 8   | website                    | text                        | YES         | null                                         |
| gmb_profiles                    | 9   | google_rating              | numeric                     | YES         | null                                         |
| gmb_profiles                    | 10  | total_reviews              | integer                     | YES         | 0                                            |
| gmb_profiles                    | 11  | category                   | text                        | YES         | null                                         |
| gmb_profiles                    | 12  | photos_count               | integer                     | YES         | 0                                            |
| gmb_profiles                    | 13  | posts_count                | integer                     | YES         | 0                                            |
| gmb_profiles                    | 14  | verification_status        | text                        | YES         | 'unverified'::text                           |
| gmb_profiles                    | 15  | last_synced                | timestamp with time zone    | YES         | now()                                        |
| gmb_profiles                    | 16  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| gmb_profiles                    | 17  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| google_job_queue                | 1   | id                         | bigint                      | NO          | nextval('google_job_queue_id_seq'::regclass) |
| google_job_queue                | 2   | partner_id                 | uuid                        | YES         | null                                         |
| google_job_queue                | 3   | location_id                | text                        | YES         | null                                         |
| google_job_queue                | 4   | job_type                   | text                        | NO          | null                                         |
| google_job_queue                | 5   | payload                    | jsonb                       | NO          | null                                         |
| google_job_queue                | 6   | retry_count                | integer                     | YES         | 0                                            |
| google_job_queue                | 7   | run_at                     | timestamp without time zone | YES         | now()                                        |
| google_job_queue                | 8   | status                     | text                        | YES         | 'pending'::text                              |
| google_job_queue                | 9   | error_message              | text                        | YES         | null                                         |
| google_job_queue                | 10  | created_at                 | timestamp without time zone | YES         | now()                                        |
| google_oauth_tokens             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| google_oauth_tokens             | 2   | user_id                    | uuid                        | YES         | null                                         |
| google_oauth_tokens             | 3   | google_user_id             | text                        | NO          | null                                         |
| google_oauth_tokens             | 4   | access_token               | text                        | NO          | null                                         |
| google_oauth_tokens             | 5   | refresh_token              | text                        | YES         | null                                         |
| google_oauth_tokens             | 6   | expires_at                 | timestamp with time zone    | YES         | null                                         |
| google_oauth_tokens             | 7   | scopes                     | ARRAY                       | YES         | '{}'::text[]                                 |
| google_oauth_tokens             | 8   | email                      | text                        | YES         | null                                         |
| google_oauth_tokens             | 9   | consent_given              | boolean                     | YES         | false                                        |
| google_oauth_tokens             | 10  | consent_timestamp          | timestamp with time zone    | YES         | null                                         |
| google_oauth_tokens             | 11  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| google_oauth_tokens             | 12  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| google_oauth_tokens             | 13  | service_type               | text                        | YES         | 'general'::text                              |
| google_oauth_tokens             | 14  | gmb_account_id             | text                        | YES         | null                                         |
| google_oauth_tokens             | 15  | ga4_property_id            | text                        | YES         | null                                         |
| google_oauth_tokens             | 16  | ads_customer_id            | text                        | YES         | null                                         |
| industry_benchmarks             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| industry_benchmarks             | 2   | industry                   | text                        | NO          | null                                         |
| industry_benchmarks             | 3   | location                   | text                        | YES         | null                                         |
| industry_benchmarks             | 4   | platform                   | text                        | NO          | null                                         |
| industry_benchmarks             | 5   | metric_name                | text                        | NO          | null                                         |
| industry_benchmarks             | 6   | metric_value               | numeric                     | NO          | null                                         |
| industry_benchmarks             | 7   | percentile_rank            | numeric                     | YES         | null                                         |
| industry_benchmarks             | 8   | sample_size                | integer                     | YES         | null                                         |
| industry_benchmarks             | 9   | data_source                | text                        | YES         | null                                         |
| industry_benchmarks             | 10  | last_updated               | timestamp with time zone    | YES         | now()                                        |
| industry_benchmarks             | 11  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| lead_events                     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| lead_events                     | 2   | email                      | text                        | YES         | null                                         |
| lead_events                     | 3   | business_name              | text                        | YES         | null                                         |
| lead_events                     | 4   | event_type                 | text                        | NO          | null                                         |
| lead_events                     | 5   | event_time                 | timestamp with time zone    | NO          | now()                                        |
| lead_events                     | 6   | event_payload              | jsonb                       | YES         | null                                         |
| lead_events                     | 7   | user_id                    | uuid                        | YES         | null                                         |
| lead_events                     | 8   | partner_id                 | uuid                        | YES         | null                                         |
| lead_events                     | 9   | facebook_event_id          | text                        | YES         | null                                         |
| lead_events                     | 10  | response_status            | integer                     | YES         | null                                         |
| lead_events                     | 11  | success                    | boolean                     | YES         | false                                        |
| lead_events                     | 12  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| main_categories                 | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| main_categories                 | 2   | slug                       | text                        | NO          | null                                         |
| main_categories                 | 3   | name_de                    | text                        | NO          | null                                         |
| main_categories                 | 4   | name_en                    | text                        | NO          | null                                         |
| main_categories                 | 5   | description_de             | text                        | YES         | null                                         |
| main_categories                 | 6   | description_en             | text                        | YES         | null                                         |
| main_categories                 | 7   | sort_order                 | integer                     | NO          | 0                                            |
| main_categories                 | 8   | is_active                  | boolean                     | NO          | true                                         |
| main_categories                 | 9   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| main_categories                 | 10  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| matching_performance            | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| matching_performance            | 2   | user_id                    | uuid                        | YES         | null                                         |
| matching_performance            | 3   | restaurant_id              | uuid                        | YES         | null                                         |
| matching_performance            | 4   | match_score                | numeric                     | NO          | null                                         |
| matching_performance            | 5   | algorithm_version          | text                        | YES         | 'v1.0'::text                                 |
| matching_performance            | 6   | criteria_weights           | jsonb                       | YES         | null                                         |
| matching_performance            | 7   | user_action                | text                        | YES         | null                                         |
| matching_performance            | 8   | session_id                 | uuid                        | YES         | null                                         |
| matching_performance            | 9   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| meal_plans                      | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| meal_plans                      | 2   | user_id                    | uuid                        | NO          | null                                         |
| meal_plans                      | 3   | week_start_date            | date                        | NO          | null                                         |
| meal_plans                      | 4   | title                      | text                        | NO          | null                                         |
| meal_plans                      | 5   | description                | text                        | YES         | null                                         |
| meal_plans                      | 6   | total_budget               | numeric                     | YES         | null                                         |
| meal_plans                      | 7   | status                     | text                        | YES         | 'draft'::text                                |
| meal_plans                      | 8   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| meal_plans                      | 9   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| meals                           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| meals                           | 2   | meal_plan_id               | uuid                        | YES         | null                                         |
| meals                           | 3   | day_of_week                | integer                     | YES         | null                                         |
| meals                           | 4   | meal_type                  | text                        | NO          | null                                         |
| meals                           | 5   | restaurant_id              | uuid                        | YES         | null                                         |
| meals                           | 6   | recipe_title               | text                        | YES         | null                                         |
| meals                           | 7   | estimated_calories         | integer                     | YES         | null                                         |
| meals                           | 8   | estimated_cost             | numeric                     | YES         | null                                         |
| meals                           | 9   | notes                      | text                        | YES         | null                                         |
| meals                           | 10  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| notes                           | 2   | title                      | text                        | NO          | null                                         |
| notes                           | 3   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| notes                           | 4   | content                    | text                        | YES         | null                                         |
| notes                           | 5   | user_id                    | uuid                        | YES         | null                                         |
| notes                           | 6   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| notes                           | 7   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| nutrition_logs                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| nutrition_logs                  | 2   | user_id                    | uuid                        | NO          | null                                         |
| nutrition_logs                  | 3   | date                       | date                        | NO          | null                                         |
| nutrition_logs                  | 4   | meal_type                  | text                        | NO          | null                                         |
| nutrition_logs                  | 5   | restaurant_id              | uuid                        | YES         | null                                         |
| nutrition_logs                  | 6   | recipe_id                  | uuid                        | YES         | null                                         |
| nutrition_logs                  | 7   | custom_meal_name           | text                        | YES         | null                                         |
| nutrition_logs                  | 8   | calories                   | integer                     | YES         | null                                         |
| nutrition_logs                  | 9   | protein                    | numeric                     | YES         | null                                         |
| nutrition_logs                  | 10  | carbohydrates              | numeric                     | YES         | null                                         |
| nutrition_logs                  | 11  | fat                        | numeric                     | YES         | null                                         |
| nutrition_logs                  | 12  | fiber                      | numeric                     | YES         | null                                         |
| nutrition_logs                  | 13  | sugar                      | numeric                     | YES         | null                                         |
| nutrition_logs                  | 14  | sodium                     | numeric                     | YES         | null                                         |
| nutrition_logs                  | 15  | cost                       | numeric                     | YES         | null                                         |
| nutrition_logs                  | 16  | notes                      | text                        | YES         | null                                         |
| nutrition_logs                  | 17  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| oauth_event_logs                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| oauth_event_logs                | 2   | user_id                    | uuid                        | YES         | null                                         |
| oauth_event_logs                | 3   | partner_id                 | uuid                        | YES         | null                                         |
| oauth_event_logs                | 4   | event_type                 | text                        | NO          | null                                         |
| oauth_event_logs                | 5   | provider                   | text                        | NO          | 'google'::text                               |
| oauth_event_logs                | 6   | action_performed           | text                        | YES         | null                                         |
| oauth_event_logs                | 7   | success                    | boolean                     | YES         | true                                         |
| oauth_event_logs                | 8   | error_message              | text                        | YES         | null                                         |
| oauth_event_logs                | 9   | ip_address                 | text                        | YES         | null                                         |
| oauth_event_logs                | 10  | user_agent                 | text                        | YES         | null                                         |
| oauth_event_logs                | 11  | context                    | jsonb                       | YES         | '{}'::jsonb                                  |
| oauth_event_logs                | 12  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| onboarding_questions            | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| onboarding_questions            | 2   | step                       | integer                     | NO          | null                                         |
| onboarding_questions            | 3   | type                       | text                        | NO          | null                                         |
| onboarding_questions            | 4   | slug                       | text                        | NO          | null                                         |
| onboarding_questions            | 5   | required                   | boolean                     | NO          | true                                         |
| onboarding_questions            | 6   | order_index                | integer                     | NO          | 0                                            |
| onboarding_questions            | 7   | translations               | jsonb                       | NO          | '{}'::jsonb                                  |
| onboarding_questions            | 8   | options                    | jsonb                       | YES         | '{}'::jsonb                                  |
| onboarding_questions            | 9   | validation_rules           | jsonb                       | YES         | '{}'::jsonb                                  |
| onboarding_questions            | 10  | conditional_logic          | jsonb                       | YES         | '{}'::jsonb                                  |
| onboarding_questions            | 11  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| onboarding_questions            | 12  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| onboarding_steps                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| onboarding_steps                | 2   | partner_id                 | uuid                        | YES         | null                                         |
| onboarding_steps                | 3   | step_name                  | text                        | NO          | null                                         |
| onboarding_steps                | 4   | completed                  | boolean                     | YES         | false                                        |
| onboarding_steps                | 5   | data                       | jsonb                       | YES         | null                                         |
| onboarding_steps                | 6   | completed_at               | timestamp without time zone | YES         | null                                         |
| onboarding_steps                | 7   | created_at                 | timestamp without time zone | YES         | now()                                        |
| partner_bookings                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| partner_bookings                | 2   | partner_id                 | uuid                        | YES         | null                                         |
| partner_bookings                | 3   | service_type               | text                        | NO          | null                                         |
| partner_bookings                | 4   | service_slug               | text                        | NO          | null                                         |
| partner_bookings                | 5   | service_name               | text                        | NO          | null                                         |
| partner_bookings                | 6   | price                      | numeric                     | NO          | null                                         |
| partner_bookings                | 7   | payment_status             | text                        | YES         | 'unpaid'::text                               |
| partner_bookings                | 8   | booking_date               | timestamp with time zone    | YES         | now()                                        |
| partner_bookings                | 9   | activated_at               | timestamp with time zone    | YES         | null                                         |
| partner_bookings                | 10  | expires_at                 | timestamp with time zone    | YES         | null                                         |
| partner_bookings                | 11  | invoice_url                | text                        | YES         | null                                         |
| partner_bookings                | 12  | payment_intent_id          | text                        | YES         | null                                         |
| partner_bookings                | 13  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_bookings                | 14  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_bookings                | 15  | stripe_customer_id         | text                        | YES         | null                                         |
| partner_bookings                | 16  | stripe_subscription_id     | text                        | YES         | null                                         |
| partner_bookings                | 17  | status                     | text                        | YES         | 'inactive'::text                             |
| partner_bookings                | 18  | go_live_required           | boolean                     | YES         | true                                         |
| partner_bookings                | 19  | go_live_at                 | timestamp without time zone | YES         | null                                         |
| partner_kpis                    | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| partner_kpis                    | 2   | partner_id                 | uuid                        | NO          | null                                         |
| partner_kpis                    | 3   | annual_revenue             | numeric                     | YES         | null                                         |
| partner_kpis                    | 4   | seating_capacity           | integer                     | YES         | null                                         |
| partner_kpis                    | 5   | food_cost_ratio            | numeric                     | YES         | null                                         |
| partner_kpis                    | 6   | labor_cost_ratio           | numeric                     | YES         | null                                         |
| partner_kpis                    | 7   | employee_count             | integer                     | YES         | null                                         |
| partner_kpis                    | 8   | opening_hours              | jsonb                       | YES         | null                                         |
| partner_kpis                    | 9   | additional_kpis            | jsonb                       | YES         | '{}'::jsonb                                  |
| partner_kpis                    | 10  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| partner_kpis                    | 11  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| partner_kpis                    | 12  | custom_features            | jsonb                       | YES         | null                                         |
| partner_kpis                    | 13  | suppliers                  | ARRAY                       | YES         | null                                         |
| partner_kpis                    | 14  | social_handles             | jsonb                       | YES         | null                                         |
| partner_kpis                    | 15  | ugc_consent                | boolean                     | YES         | false                                        |
| partner_onboarding_steps        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| partner_onboarding_steps        | 2   | partner_id                 | uuid                        | YES         | null                                         |
| partner_onboarding_steps        | 3   | step_name                  | text                        | NO          | null                                         |
| partner_onboarding_steps        | 4   | completed                  | boolean                     | YES         | false                                        |
| partner_onboarding_steps        | 5   | completed_at               | timestamp with time zone    | YES         | null                                         |
| partner_onboarding_steps        | 6   | data                       | jsonb                       | YES         | null                                         |
| partner_onboarding_steps        | 7   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_onboarding_steps        | 8   | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_onboarding_steps        | 9   | metadata                   | jsonb                       | YES         | null                                         |
| partner_private_contacts        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| partner_private_contacts        | 2   | customer_id                | uuid                        | NO          | null                                         |
| partner_private_contacts        | 3   | first_name                 | text                        | NO          | null                                         |
| partner_private_contacts        | 4   | last_name                  | text                        | NO          | null                                         |
| partner_private_contacts        | 5   | contact_email              | text                        | NO          | null                                         |
| partner_private_contacts        | 6   | contact_phone              | text                        | NO          | null                                         |
| partner_private_contacts        | 7   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| partner_private_contacts        | 8   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| partner_profile_draft           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| partner_profile_draft           | 2   | user_id                    | uuid                        | NO          | null                                         |
| partner_profile_draft           | 3   | profile_data               | jsonb                       | NO          | '{}'::jsonb                                  |
| partner_profile_draft           | 4   | test_mode                  | boolean                     | YES         | true                                         |
| partner_profile_draft           | 5   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_profile_draft           | 6   | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| partner_upload_quota            | 1   | partner_id                 | uuid                        | NO          | null                                         |
| partner_upload_quota            | 2   | month_start                | date                        | NO          | null                                         |
| partner_upload_quota            | 3   | uploads_used               | integer                     | YES         | 0                                            |
| platform_recommendations        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| platform_recommendations        | 2   | lead_id                    | uuid                        | NO          | null                                         |
| platform_recommendations        | 3   | platform                   | text                        | NO          | null                                         |
| platform_recommendations        | 4   | recommendation_type        | text                        | NO          | null                                         |
| platform_recommendations        | 5   | title                      | text                        | NO          | null                                         |
| platform_recommendations        | 6   | description                | text                        | YES         | null                                         |
| platform_recommendations        | 7   | priority                   | text                        | YES         | 'medium'::text                               |
| platform_recommendations        | 8   | implementation_difficulty  | text                        | YES         | 'medium'::text                               |
| platform_recommendations        | 9   | estimated_impact           | text                        | YES         | null                                         |
| platform_recommendations        | 10  | status                     | text                        | YES         | 'pending'::text                              |
| platform_recommendations        | 11  | metadata                   | jsonb                       | YES         | '{}'::jsonb                                  |
| platform_recommendations        | 12  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| platform_recommendations        | 13  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| profiles                        | 1   | id                         | uuid                        | NO          | null                                         |
| profiles                        | 2   | name                       | text                        | NO          | null                                         |
| profiles                        | 3   | language                   | text                        | NO          | 'de'::text                                   |
| profiles                        | 4   | role                       | text                        | NO          | 'user'::text                                 |
| profiles                        | 5   | allergies                  | ARRAY                       | YES         | '{}'::text[]                                 |
| profiles                        | 6   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| profiles                        | 7   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| profiles                        | 8   | granted_features           | jsonb                       | YES         | '[]'::jsonb                                  |
| profiles                        | 9   | feature_access_until       | timestamp with time zone    | YES         | null                                         |
| profiles                        | 10  | subscription_status        | text                        | YES         | 'free'::text                                 |
| promo_code_usage                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| promo_code_usage                | 2   | promo_code_id              | uuid                        | YES         | null                                         |
| promo_code_usage                | 3   | user_id                    | uuid                        | YES         | null                                         |
| promo_code_usage                | 4   | used_at                    | timestamp with time zone    | YES         | now()                                        |
| promo_codes                     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| promo_codes                     | 2   | code                       | text                        | NO          | null                                         |
| promo_codes                     | 3   | description                | text                        | YES         | null                                         |
| promo_codes                     | 4   | discount_type              | text                        | YES         | null                                         |
| promo_codes                     | 5   | discount_value             | integer                     | YES         | null                                         |
| promo_codes                     | 6   | max_uses                   | integer                     | YES         | 1                                            |
| promo_codes                     | 7   | current_uses               | integer                     | YES         | 0                                            |
| promo_codes                     | 8   | status                     | text                        | YES         | 'active'::text                               |
| promo_codes                     | 9   | valid_from                 | timestamp with time zone    | YES         | now()                                        |
| promo_codes                     | 10  | valid_until                | timestamp with time zone    | YES         | null                                         |
| promo_codes                     | 11  | created_by                 | uuid                        | YES         | null                                         |
| promo_codes                     | 12  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| promo_codes                     | 13  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| promo_codes                     | 14  | is_review_code             | boolean                     | YES         | false                                        |
| promo_codes                     | 15  | granted_features           | jsonb                       | YES         | '[]'::jsonb                                  |
| promo_codes                     | 16  | granted_role               | text                        | YES         | 'user'::text                                 |
| ratings                         | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| ratings                         | 2   | user_id                    | uuid                        | NO          | null                                         |
| ratings                         | 3   | restaurant_id              | uuid                        | NO          | null                                         |
| ratings                         | 4   | rating                     | integer                     | NO          | null                                         |
| ratings                         | 5   | comment                    | text                        | YES         | null                                         |
| ratings                         | 6   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| recipes                         | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| recipes                         | 2   | created_by                 | uuid                        | YES         | null                                         |
| recipes                         | 3   | title                      | text                        | NO          | null                                         |
| recipes                         | 4   | description                | text                        | YES         | null                                         |
| recipes                         | 5   | prep_time                  | integer                     | YES         | null                                         |
| recipes                         | 6   | cook_time                  | integer                     | YES         | null                                         |
| recipes                         | 7   | servings                   | integer                     | YES         | 2                                            |
| recipes                         | 8   | difficulty                 | text                        | YES         | 'easy'::text                                 |
| recipes                         | 9   | cuisine_type               | text                        | YES         | null                                         |
| recipes                         | 10  | dietary_tags               | ARRAY                       | YES         | '{}'::text[]                                 |
| recipes                         | 11  | ingredients                | jsonb                       | NO          | '[]'::jsonb                                  |
| recipes                         | 12  | instructions               | jsonb                       | NO          | '[]'::jsonb                                  |
| recipes                         | 13  | nutrition_per_serving      | jsonb                       | YES         | '{}'::jsonb                                  |
| recipes                         | 14  | estimated_cost             | numeric                     | YES         | null                                         |
| recipes                         | 15  | is_public                  | boolean                     | YES         | false                                        |
| recipes                         | 16  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| recipes                         | 17  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| restaurant_analytics            | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| restaurant_analytics            | 2   | restaurant_id              | uuid                        | YES         | null                                         |
| restaurant_analytics            | 3   | date                       | date                        | NO          | null                                         |
| restaurant_analytics            | 4   | profile_views              | integer                     | YES         | 0                                            |
| restaurant_analytics            | 5   | recommendation_count       | integer                     | YES         | 0                                            |
| restaurant_analytics            | 6   | social_shares              | integer                     | YES         | 0                                            |
| restaurant_analytics            | 7   | dudle_selections           | integer                     | YES         | 0                                            |
| restaurant_analytics            | 8   | click_through_rate         | numeric                     | YES         | 0.0                                          |
| restaurant_analytics            | 9   | conversion_rate            | numeric                     | YES         | 0.0                                          |
| restaurant_analytics            | 10  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| restaurant_features             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| restaurant_features             | 2   | restaurant_id              | uuid                        | YES         | null                                         |
| restaurant_features             | 3   | has_vegan_options          | boolean                     | YES         | false                                        |
| restaurant_features             | 4   | has_vegetarian_options     | boolean                     | YES         | false                                        |
| restaurant_features             | 5   | has_gluten_free_options    | boolean                     | YES         | false                                        |
| restaurant_features             | 6   | has_diabetic_friendly      | boolean                     | YES         | false                                        |
| restaurant_features             | 7   | accepts_reservations       | boolean                     | YES         | true                                         |
| restaurant_features             | 8   | has_delivery               | boolean                     | YES         | false                                        |
| restaurant_features             | 9   | has_takeout                | boolean                     | YES         | true                                         |
| restaurant_features             | 10  | price_range                | text                        | YES         | '$$'::text                                   |
| restaurant_features             | 11  | atmosphere_tags            | ARRAY                       | YES         | '{}'::text[]                                 |
| restaurant_features             | 12  | accessibility_features     | ARRAY                       | YES         | '{}'::text[]                                 |
| restaurant_features             | 13  | payment_methods            | ARRAY                       | YES         | '{}'::text[]                                 |
| restaurant_features             | 14  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| restaurant_features             | 15  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| restaurants                     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| restaurants                     | 2   | name                       | text                        | NO          | null                                         |
| restaurants                     | 3   | address                    | text                        | NO          | null                                         |
| restaurants                     | 4   | latitude                   | numeric                     | YES         | null                                         |
| restaurants                     | 5   | longitude                  | numeric                     | YES         | null                                         |
| restaurants                     | 6   | cuisine_type               | text                        | YES         | null                                         |
| restaurants                     | 7   | description                | text                        | YES         | null                                         |
| restaurants                     | 8   | phone                      | text                        | YES         | null                                         |
| restaurants                     | 9   | website                    | text                        | YES         | null                                         |
| restaurants                     | 10  | verified                   | boolean                     | YES         | false                                        |
| restaurants                     | 11  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| restaurants                     | 12  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| security_alerts                 | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| security_alerts                 | 2   | alert_type                 | text                        | NO          | null                                         |
| security_alerts                 | 3   | severity                   | text                        | NO          | 'medium'::text                               |
| security_alerts                 | 4   | title                      | text                        | NO          | null                                         |
| security_alerts                 | 5   | description                | text                        | NO          | null                                         |
| security_alerts                 | 6   | user_id                    | uuid                        | YES         | null                                         |
| security_alerts                 | 7   | metadata                   | jsonb                       | YES         | '{}'::jsonb                                  |
| security_alerts                 | 8   | resolved                   | boolean                     | YES         | false                                        |
| security_alerts                 | 9   | resolved_by                | uuid                        | YES         | null                                         |
| security_alerts                 | 10  | resolved_at                | timestamp with time zone    | YES         | null                                         |
| security_alerts                 | 11  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| security_audit_log              | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| security_audit_log              | 2   | user_id                    | uuid                        | YES         | null                                         |
| security_audit_log              | 3   | table_name                 | text                        | NO          | null                                         |
| security_audit_log              | 4   | operation                  | text                        | NO          | null                                         |
| security_audit_log              | 5   | old_data                   | jsonb                       | YES         | null                                         |
| security_audit_log              | 6   | new_data                   | jsonb                       | YES         | null                                         |
| security_audit_log              | 7   | changed_fields             | ARRAY                       | YES         | null                                         |
| security_audit_log              | 8   | ip_address                 | inet                        | YES         | null                                         |
| security_audit_log              | 9   | user_agent                 | text                        | YES         | null                                         |
| security_audit_log              | 10  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| security_events                 | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| security_events                 | 2   | event_type                 | text                        | NO          | null                                         |
| security_events                 | 3   | user_id                    | uuid                        | YES         | null                                         |
| security_events                 | 4   | ip_address                 | inet                        | YES         | null                                         |
| security_events                 | 5   | user_agent                 | text                        | YES         | null                                         |
| security_events                 | 6   | details                    | jsonb                       | YES         | '{}'::jsonb                                  |
| security_events                 | 7   | severity                   | text                        | YES         | 'info'::text                                 |
| security_events                 | 8   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| service_audit_log               | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| service_audit_log               | 2   | user_id                    | uuid                        | YES         | null                                         |
| service_audit_log               | 3   | action                     | text                        | NO          | null                                         |
| service_audit_log               | 4   | table_name                 | text                        | NO          | null                                         |
| service_audit_log               | 5   | row_data                   | jsonb                       | YES         | null                                         |
| service_audit_log               | 6   | old_data                   | jsonb                       | YES         | null                                         |
| service_audit_log               | 7   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| service_packages                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| service_packages                | 2   | code                       | text                        | NO          | null                                         |
| service_packages                | 3   | default_name               | text                        | NO          | null                                         |
| service_packages                | 4   | is_recurring               | boolean                     | YES         | false                                        |
| service_packages                | 5   | interval_months            | integer                     | YES         | null                                         |
| service_packages                | 6   | created_at                 | timestamp without time zone | YES         | now()                                        |
| service_packages                | 7   | is_active                  | boolean                     | YES         | true                                         |
| service_packages                | 8   | slug                       | text                        | YES         | null                                         |
| service_packages                | 9   | base_price                 | integer                     | YES         | null                                         |
| service_packages                | 10  | original_price             | integer                     | YES         | null                                         |
| service_packages                | 11  | features                   | ARRAY                       | YES         | '{}'::text[]                                 |
| service_packages                | 12  | is_recommended             | boolean                     | NO          | false                                        |
| service_packages                | 13  | min_duration_months        | integer                     | YES         | null                                         |
| service_packages                | 14  | name                       | text                        | YES         | null                                         |
| service_packages                | 15  | description                | text                        | YES         | null                                         |
| service_packages_legacy         | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| service_packages_legacy         | 2   | name                       | text                        | NO          | null                                         |
| service_packages_legacy         | 3   | slug                       | text                        | NO          | null                                         |
| service_packages_legacy         | 4   | description                | text                        | YES         | null                                         |
| service_packages_legacy         | 5   | base_price                 | numeric                     | NO          | null                                         |
| service_packages_legacy         | 6   | original_price             | numeric                     | YES         | null                                         |
| service_packages_legacy         | 7   | period                     | text                        | NO          | 'monthly'::text                              |
| service_packages_legacy         | 8   | min_duration_months        | integer                     | YES         | 0                                            |
| service_packages_legacy         | 9   | features                   | ARRAY                       | YES         | '{}'::text[]                                 |
| service_packages_legacy         | 10  | name_translations          | jsonb                       | YES         | '{}'::jsonb                                  |
| service_packages_legacy         | 11  | description_translations   | jsonb                       | YES         | '{}'::jsonb                                  |
| service_packages_legacy         | 12  | features_translations      | jsonb                       | YES         | '{}'::jsonb                                  |
| service_packages_legacy         | 13  | badge_translations         | jsonb                       | YES         | '{}'::jsonb                                  |
| service_packages_legacy         | 14  | is_active                  | boolean                     | YES         | true                                         |
| service_packages_legacy         | 15  | is_recommended             | boolean                     | YES         | false                                        |
| service_packages_legacy         | 16  | sort_order                 | integer                     | YES         | 0                                            |
| service_packages_legacy         | 17  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| service_packages_legacy         | 18  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| service_price_history           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| service_price_history           | 2   | service_type               | text                        | NO          | null                                         |
| service_price_history           | 3   | service_id                 | uuid                        | NO          | null                                         |
| service_price_history           | 4   | old_price                  | numeric                     | YES         | null                                         |
| service_price_history           | 5   | new_price                  | numeric                     | NO          | null                                         |
| service_price_history           | 6   | changed_by                 | uuid                        | YES         | null                                         |
| service_price_history           | 7   | changed_at                 | timestamp with time zone    | YES         | now()                                        |
| service_price_history           | 8   | reason                     | text                        | YES         | null                                         |
| service_prices                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| service_prices                  | 2   | package_id                 | uuid                        | YES         | null                                         |
| service_prices                  | 3   | currency                   | text                        | YES         | 'EUR'::text                                  |
| service_prices                  | 4   | normal_price_cents         | integer                     | NO          | null                                         |
| service_prices                  | 5   | promo_price_cents          | integer                     | YES         | null                                         |
| service_prices                  | 6   | promo_active               | boolean                     | YES         | false                                        |
| service_prices                  | 7   | valid_from                 | timestamp without time zone | YES         | now()                                        |
| service_prices                  | 8   | valid_to                   | timestamp without time zone | YES         | null                                         |
| shopping_list_items             | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| shopping_list_items             | 2   | shopping_list_id           | uuid                        | YES         | null                                         |
| shopping_list_items             | 3   | ingredient_name            | text                        | NO          | null                                         |
| shopping_list_items             | 4   | quantity                   | text                        | NO          | null                                         |
| shopping_list_items             | 5   | category                   | text                        | YES         | null                                         |
| shopping_list_items             | 6   | estimated_price            | numeric                     | YES         | null                                         |
| shopping_list_items             | 7   | is_purchased               | boolean                     | YES         | false                                        |
| shopping_list_items             | 8   | notes                      | text                        | YES         | null                                         |
| shopping_list_items             | 9   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| shopping_lists                  | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| shopping_lists                  | 2   | meal_plan_id               | uuid                        | YES         | null                                         |
| shopping_lists                  | 3   | user_id                    | uuid                        | NO          | null                                         |
| shopping_lists                  | 4   | title                      | text                        | NO          | null                                         |
| shopping_lists                  | 5   | total_estimated_cost       | numeric                     | YES         | null                                         |
| shopping_lists                  | 6   | status                     | text                        | YES         | 'pending'::text                              |
| shopping_lists                  | 7   | created_at                 | timestamp with time zone    | NO          | now()                                        |
| shopping_lists                  | 8   | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| social_media_channels           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| social_media_channels           | 2   | name                       | text                        | NO          | null                                         |
| social_media_channels           | 3   | slug                       | text                        | NO          | null                                         |
| social_media_channels           | 4   | platform                   | text                        | NO          | null                                         |
| social_media_channels           | 5   | icon_name                  | text                        | NO          | null                                         |
| social_media_channels           | 6   | base_price                 | numeric                     | NO          | null                                         |
| social_media_channels           | 7   | description                | text                        | YES         | null                                         |
| social_media_channels           | 8   | is_active                  | boolean                     | YES         | true                                         |
| social_media_channels           | 9   | sort_order                 | integer                     | YES         | 0                                            |
| social_media_channels           | 10  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| social_media_channels           | 11  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| swot_analysis                   | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| swot_analysis                   | 2   | lead_id                    | uuid                        | NO          | null                                         |
| swot_analysis                   | 3   | strengths                  | ARRAY                       | YES         | null                                         |
| swot_analysis                   | 4   | weaknesses                 | ARRAY                       | YES         | null                                         |
| swot_analysis                   | 5   | opportunities              | ARRAY                       | YES         | null                                         |
| swot_analysis                   | 6   | threats                    | ARRAY                       | YES         | null                                         |
| swot_analysis                   | 7   | overall_score              | numeric                     | YES         | null                                         |
| swot_analysis                   | 8   | analysis_data              | jsonb                       | YES         | '{}'::jsonb                                  |
| swot_analysis                   | 9   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| swot_analysis                   | 10  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| unclaimed_business_profiles     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| unclaimed_business_profiles     | 2   | business_name              | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 3   | location                   | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 4   | contact_email              | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 5   | contact_phone              | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 6   | website                    | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 7   | category_ids               | ARRAY                       | YES         | null                                         |
| unclaimed_business_profiles     | 8   | matbakh_category           | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 9   | address                    | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 10  | opening_hours              | ARRAY                       | YES         | null                                         |
| unclaimed_business_profiles     | 11  | special_features           | jsonb                       | YES         | null                                         |
| unclaimed_business_profiles     | 12  | business_model             | ARRAY                       | YES         | null                                         |
| unclaimed_business_profiles     | 13  | revenue_streams            | ARRAY                       | YES         | null                                         |
| unclaimed_business_profiles     | 14  | target_audience            | ARRAY                       | YES         | null                                         |
| unclaimed_business_profiles     | 15  | seating_capacity           | integer                     | YES         | null                                         |
| unclaimed_business_profiles     | 16  | lead_id                    | uuid                        | YES         | null                                         |
| unclaimed_business_profiles     | 17  | claimed_by_user_id         | uuid                        | YES         | null                                         |
| unclaimed_business_profiles     | 18  | claimed_at                 | timestamp with time zone    | YES         | null                                         |
| unclaimed_business_profiles     | 19  | claim_status               | text                        | YES         | 'unclaimed'::text                            |
| unclaimed_business_profiles     | 20  | notes                      | text                        | YES         | null                                         |
| unclaimed_business_profiles     | 21  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| unclaimed_business_profiles     | 22  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| unclaimed_business_profiles     | 23  | competition_level          | text                        | NO          | 'medium'::text                               |
| unclaimed_business_profiles     | 24  | monetization_tier          | text                        | NO          | 'standard'::text                             |
| unclaimed_business_profiles     | 25  | market_analysis            | jsonb                       | NO          | '{}'::jsonb                                  |
| user_consent_tracking           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| user_consent_tracking           | 2   | user_id                    | uuid                        | YES         | null                                         |
| user_consent_tracking           | 3   | partner_id                 | uuid                        | YES         | null                                         |
| user_consent_tracking           | 4   | consent_type               | text                        | NO          | null                                         |
| user_consent_tracking           | 5   | consent_given              | boolean                     | NO          | null                                         |
| user_consent_tracking           | 6   | consent_timestamp          | timestamp with time zone    | YES         | now()                                        |
| user_consent_tracking           | 7   | ip_address                 | inet                        | YES         | null                                         |
| user_consent_tracking           | 8   | user_agent                 | text                        | YES         | null                                         |
| user_consent_tracking           | 9   | consent_method             | text                        | YES         | null                                         |
| user_consent_tracking           | 10  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| user_dietary_profiles           | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| user_dietary_profiles           | 2   | user_id                    | uuid                        | NO          | null                                         |
| user_dietary_profiles           | 3   | dietary_restrictions       | ARRAY                       | YES         | '{}'::text[]                                 |
| user_dietary_profiles           | 4   | allergies                  | ARRAY                       | YES         | '{}'::text[]                                 |
| user_dietary_profiles           | 5   | health_conditions          | ARRAY                       | YES         | '{}'::text[]                                 |
| user_dietary_profiles           | 6   | calorie_goal               | integer                     | YES         | null                                         |
| user_dietary_profiles           | 7   | protein_goal               | integer                     | YES         | null                                         |
| user_dietary_profiles           | 8   | carb_goal                  | integer                     | YES         | null                                         |
| user_dietary_profiles           | 9   | fat_goal                   | integer                     | YES         | null                                         |
| user_dietary_profiles           | 10  | is_diabetic                | boolean                     | YES         | false                                        |
| user_dietary_profiles           | 11  | diabetes_type              | text                        | YES         | null                                         |
| user_dietary_profiles           | 12  | preferred_meal_times       | ARRAY                       | YES         | '{}'::text[]                                 |
| user_dietary_profiles           | 13  | cuisine_preferences        | ARRAY                       | YES         | '{}'::text[]                                 |
| user_dietary_profiles           | 14  | spice_tolerance            | text                        | YES         | 'medium'::text                               |
| user_dietary_profiles           | 15  | budget_min                 | numeric                     | YES         | null                                         |
| user_dietary_profiles           | 16  | budget_max                 | numeric                     | YES         | null                                         |
| user_dietary_profiles           | 17  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| user_dietary_profiles           | 18  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| user_preferences                | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| user_preferences                | 2   | user_id                    | uuid                        | YES         | null                                         |
| user_preferences                | 3   | language                   | text                        | YES         | 'de'::text                                   |
| user_preferences                | 4   | preferred_cuisines         | ARRAY                       | YES         | '{}'::text[]                                 |
| user_preferences                | 5   | allergens                  | ARRAY                       | YES         | '{}'::text[]                                 |
| user_preferences                | 6   | avoid_ingredients          | ARRAY                       | YES         | '{}'::text[]                                 |
| user_preferences                | 7   | price_range                | text                        | YES         | 'medium'::text                               |
| user_preferences                | 8   | max_distance_km            | integer                     | YES         | 5                                            |
| user_preferences                | 9   | group_size                 | integer                     | YES         | 2                                            |
| user_preferences                | 10  | meal_times                 | ARRAY                       | YES         | '{lunch,dinner}'::text[]                     |
| user_preferences                | 11  | atmosphere_preferences     | ARRAY                       | YES         | '{}'::text[]                                 |
| user_preferences                | 12  | dietary_restrictions       | ARRAY                       | YES         | '{}'::text[]                                 |
| user_preferences                | 13  | budget_per_person_min      | numeric                     | YES         | 15.00                                        |
| user_preferences                | 14  | budget_per_person_max      | numeric                     | YES         | 50.00                                        |
| user_preferences                | 15  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| user_preferences                | 16  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| user_shares                     | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| user_shares                     | 2   | user_id                    | uuid                        | YES         | null                                         |
| user_shares                     | 3   | restaurant_id              | uuid                        | YES         | null                                         |
| user_shares                     | 4   | platform                   | text                        | NO          | null                                         |
| user_shares                     | 5   | share_type                 | text                        | YES         | 'recommendation'::text                       |
| user_shares                     | 6   | caption                    | text                        | YES         | null                                         |
| user_shares                     | 7   | media_url                  | text                        | YES         | null                                         |
| user_shares                     | 8   | external_post_id           | text                        | YES         | null                                         |
| user_shares                     | 9   | likes_count                | integer                     | YES         | 0                                            |
| user_shares                     | 10  | comments_count             | integer                     | YES         | 0                                            |
| user_shares                     | 11  | shares_count               | integer                     | YES         | 0                                            |
| user_shares                     | 12  | engagement_score           | numeric                     | YES         | 0.0                                          |
| user_shares                     | 13  | shared_at                  | timestamp with time zone    | YES         | now()                                        |
| user_shares                     | 14  | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| visibility_check_actions        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| visibility_check_actions        | 2   | lead_id                    | uuid                        | NO          | null                                         |
| visibility_check_actions        | 3   | todo_type                  | text                        | NO          | null                                         |
| visibility_check_actions        | 4   | todo_text                  | text                        | NO          | null                                         |
| visibility_check_actions        | 5   | todo_why                   | text                        | NO          | null                                         |
| visibility_check_actions        | 6   | is_critical                | boolean                     | NO          | false                                        |
| visibility_check_actions        | 7   | is_done                    | boolean                     | NO          | false                                        |
| visibility_check_actions        | 8   | platform                   | text                        | NO          | 'google'::text                               |
| visibility_check_actions        | 9   | detected_at                | timestamp with time zone    | NO          | now()                                        |
| visibility_check_actions        | 10  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| visibility_check_actions        | 11  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| visibility_check_leads          | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| visibility_check_leads          | 2   | business_name              | text                        | NO          | null                                         |
| visibility_check_leads          | 3   | website                    | text                        | YES         | null                                         |
| visibility_check_leads          | 4   | email                      | text                        | YES         | null                                         |
| visibility_check_leads          | 5   | location_text              | text                        | YES         | null                                         |
| visibility_check_leads          | 6   | check_type                 | text                        | NO          | 'basic'::text                                |
| visibility_check_leads          | 7   | result_status              | text                        | NO          | 'pending'::text                              |
| visibility_check_leads          | 8   | overall_score              | integer                     | YES         | null                                         |
| visibility_check_leads          | 9   | google_score               | integer                     | YES         | null                                         |
| visibility_check_leads          | 10  | facebook_score             | integer                     | YES         | null                                         |
| visibility_check_leads          | 11  | instagram_score            | integer                     | YES         | null                                         |
| visibility_check_leads          | 12  | found_business             | boolean                     | YES         | false                                        |
| visibility_check_leads          | 13  | analysis_data              | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_leads          | 14  | full_report_url            | text                        | YES         | null                                         |
| visibility_check_leads          | 15  | user_id                    | uuid                        | YES         | null                                         |
| visibility_check_leads          | 16  | migrated_to_profile        | boolean                     | YES         | false                                        |
| visibility_check_leads          | 17  | created_at                 | timestamp with time zone    | NO          | now()                                        |
| visibility_check_leads          | 18  | updated_at                 | timestamp with time zone    | NO          | now()                                        |
| visibility_check_leads          | 19  | business_model             | ARRAY                       | YES         | null                                         |
| visibility_check_leads          | 20  | revenue_streams            | ARRAY                       | YES         | null                                         |
| visibility_check_leads          | 21  | target_audience            | ARRAY                       | YES         | null                                         |
| visibility_check_leads          | 22  | seating_capacity           | integer                     | YES         | null                                         |
| visibility_check_leads          | 23  | opening_hours              | jsonb                       | YES         | null                                         |
| visibility_check_leads          | 24  | special_features           | jsonb                       | YES         | null                                         |
| visibility_check_leads          | 25  | tiktok_handle              | text                        | YES         | null                                         |
| visibility_check_leads          | 26  | linkedin_handle            | text                        | YES         | null                                         |
| visibility_check_leads          | 27  | analysis_status            | text                        | YES         | 'pending'::text                              |
| visibility_check_leads          | 28  | benchmarks                 | jsonb                       | YES         | null                                         |
| visibility_check_leads          | 29  | location                   | text                        | YES         | null                                         |
| visibility_check_leads          | 30  | postal_code                | text                        | YES         | null                                         |
| visibility_check_leads          | 31  | main_category              | text                        | YES         | null                                         |
| visibility_check_leads          | 32  | sub_category               | text                        | YES         | null                                         |
| visibility_check_leads          | 33  | matbakh_category           | text                        | YES         | null                                         |
| visibility_check_leads          | 34  | facebook_handle            | text                        | YES         | null                                         |
| visibility_check_leads          | 35  | instagram_handle           | text                        | YES         | null                                         |
| visibility_check_leads          | 36  | gdpr_consent               | boolean                     | YES         | false                                        |
| visibility_check_leads          | 37  | marketing_consent          | boolean                     | YES         | false                                        |
| visibility_check_leads          | 38  | ip_address                 | text                        | YES         | null                                         |
| visibility_check_leads          | 39  | user_agent                 | text                        | YES         | null                                         |
| visibility_check_leads          | 40  | analyzed_at                | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 41  | verification_token         | text                        | YES         | null                                         |
| visibility_check_leads          | 42  | double_optin_sent_at       | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 43  | double_optin_confirmed     | boolean                     | YES         | false                                        |
| visibility_check_leads          | 44  | double_optin_confirmed_at  | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 45  | report_sent_at             | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 46  | status                     | text                        | YES         | 'pending'::text                              |
| visibility_check_leads          | 47  | analysis_error_message     | text                        | YES         | null                                         |
| visibility_check_leads          | 48  | report_url                 | text                        | YES         | null                                         |
| visibility_check_leads          | 49  | report_generated_at        | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 50  | confirm_token_hash         | text                        | YES         | null                                         |
| visibility_check_leads          | 51  | confirm_expires_at         | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 52  | email_confirmed            | boolean                     | YES         | false                                        |
| visibility_check_leads          | 53  | analysis_started_at        | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 54  | analysis_completed_at      | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 55  | locale                     | text                        | YES         | 'de'::text                                   |
| visibility_check_leads          | 56  | marketing_consent_at       | timestamp with time zone    | YES         | null                                         |
| visibility_check_leads          | 57  | phone_number               | text                        | YES         | null                                         |
| visibility_check_leads          | 58  | language                   | text                        | YES         | null                                         |
| visibility_check_leads          | 59  | location_data              | jsonb                       | YES         | null                                         |
| visibility_check_leads          | 60  | social_links               | jsonb                       | YES         | null                                         |
| visibility_check_leads          | 61  | competitor_urls            | ARRAY                       | YES         | null                                         |
| visibility_check_results        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| visibility_check_results        | 2   | business_profile_id        | uuid                        | NO          | null                                         |
| visibility_check_results        | 3   | check_type                 | text                        | YES         | 'onboarding'::text                           |
| visibility_check_results        | 4   | overall_score              | integer                     | YES         | null                                         |
| visibility_check_results        | 5   | category_scores            | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_results        | 6   | recommendations            | jsonb                       | YES         | '[]'::jsonb                                  |
| visibility_check_results        | 7   | competitive_analysis       | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_results        | 8   | missing_elements           | ARRAY                       | YES         | '{}'::text[]                                 |
| visibility_check_results        | 9   | strengths                  | ARRAY                       | YES         | '{}'::text[]                                 |
| visibility_check_results        | 10  | dashboard_widgets          | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_results        | 11  | pdf_export_data            | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_results        | 12  | analysis_duration_ms       | integer                     | YES         | null                                         |
| visibility_check_results        | 13  | data_sources_used          | ARRAY                       | YES         | '{}'::text[]                                 |
| visibility_check_results        | 14  | api_calls_made             | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_check_results        | 15  | created_at                 | timestamp with time zone    | YES         | now()                                        |
| visibility_health_monitor       | 1   | check_date                 | date                        | YES         | null                                         |
| visibility_health_monitor       | 2   | total_leads                | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 3   | pending_leads              | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 4   | analyzing_leads            | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 5   | completed_leads            | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 6   | failed_leads               | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 7   | reports_generated          | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 8   | missing_reports            | bigint                      | YES         | null                                         |
| visibility_health_monitor       | 9   | stale_pending              | bigint                      | YES         | null                                         |
| visibility_trends               | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| visibility_trends               | 2   | lead_id                    | uuid                        | NO          | null                                         |
| visibility_trends               | 3   | trend_metrics              | jsonb                       | YES         | '{}'::jsonb                                  |
| visibility_trends               | 4   | trends_date                | date                        | YES         | CURRENT_DATE                                 |
| visibility_trends               | 5   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| visibility_trends               | 6   | updated_at                 | timestamp with time zone    | YES         | now()                                        |
| waitlist                        | 1   | id                         | uuid                        | NO          | gen_random_uuid()                            |
| waitlist                        | 2   | email                      | text                        | NO          | null                                         |
| waitlist                        | 3   | interests                  | ARRAY                       | YES         | '{}'::text[]                                 |
| waitlist                        | 4   | source                     | text                        | YES         | 'landing_page'::text                         |
| waitlist                        | 5   | language                   | text                        | YES         | 'de'::text                                   |
| waitlist                        | 6   | created_at                 | timestamp with time zone    | YES         | now()                                        |
| waitlist                        | 7   | device                     | text                        | YES         | null                                         |
| waitlist                        | 8   | browser                    | text                        | YES         | null                                         |
| waitlist                        | 9   | os                         | text                        | YES         | null                                         |
| waitlist                        | 10  | referrer                   | text                        | YES         | null                                         |
| waitlist                        | 11  | utm_source                 | text                        | YES         | null                                         |
| waitlist                        | 12  | utm_campaign               | text                        | YES         | null                                         |
| waitlist                        | 13  | utm_medium                 | text                        | YES         | null                                         |
| waitlist                        | 14  | consent_gdpr               | boolean                     | YES         | false                                        |
| waitlist                        | 15  | ip_address                 | text                        | YES         | null                                         |
| waitlist                        | 16  | service_slug               | text                        | YES         | null                                         |<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 
