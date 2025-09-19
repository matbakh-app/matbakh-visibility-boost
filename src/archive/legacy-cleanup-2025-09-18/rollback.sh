#!/bin/bash
# Safe Archival System - Instant Rollback Script
# Generated: 2025-09-18T10-54-58-184Z
# Archive: src/archive/legacy-cleanup-2025-09-18

set -e

echo "🔄 Starting rollback process..."
echo "📦 Archive: src/archive/legacy-cleanup-2025-09-18"

# Function to restore a single component
restore_component() {
    local archive_path="$1"
    local original_path="$2"
    local checksum="$3"
    
    if [ -f "$archive_path" ]; then
        echo "📁 Restoring: $original_path"
        
        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$original_path")"
        
        # Copy file back
        cp "$archive_path" "$original_path"
        
        # Verify checksum
        if command -v sha256sum >/dev/null 2>&1; then
            local current_checksum=$(sha256sum "$original_path" | cut -d' ' -f1)
            if [ "$current_checksum" != "$checksum" ]; then
                echo "⚠️ Checksum mismatch for $original_path"
            fi
        fi
        
        echo "✅ Restored: $original_path"
    else
        echo "❌ Archive file not found: $archive_path"
        return 1
    fi
}

# Restore all components
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/FacebookTestComponent.tsx" "src/components/FacebookTestComponent.tsx" "896004edb9794fbc0751ca9a0b4726c6232e33734a46222071ca93a281ac2653"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/HowItWorksSection.tsx" "src/components/HowItWorksSection.tsx" "fbccfb9bf144f270db15a9ee5ace9277d1ce13ecd2dde6c85de586a9225249f2"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/SafeAuthLoader.tsx" "src/components/SafeAuthLoader.tsx" "18feecca20cb107b38c214574b84ef35a14f05b272f6a6162fdc4b04cedd68e6"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/SafeTranslationLoader.tsx" "src/components/SafeTranslationLoader.tsx" "aa2e5c41b02d8281e01ea8467413ec23954458166d0c9607cde56339e081c1ed"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/SeoHead.tsx" "src/components/SeoHead.tsx" "8c8da63e5aed5b5d04a32795df4f4bd9da1dcf9e00884d5a83daa0a5392f3ee5"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/TestimonialSection.tsx" "src/components/TestimonialSection.tsx" "71a3b4fc8198dbf9f15d827dd309074e17fb2d806385374eb07ea30c4cc5b4cc"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/TrustSection.tsx" "src/components/TrustSection.tsx" "e5798640bc9a90b205158aa56f20351894f35dc08174fced0d2d480722d8db9b"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/VisibilityCheckSection.tsx" "src/components/VisibilityCheckSection.tsx" "cb91787e14af19c214371617d4a73d57ae5b4dccf8bdfd2c48c42d2773511363"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/BenchmarkComparison.tsx" "src/components/analytics/BenchmarkComparison.tsx" "fb18b69d3e44913b062e8d803d825c2ad5334999bb1af3dcd0150c59179a6fb2"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/ForecastChart-legacy.tsx" "src/components/analytics/ForecastChart-legacy.tsx" "fb40bb2787355cf58fcab413652d8ed74339dd6e05404387246a8d66c30f1da2"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/MultiRegionBenchmark.tsx" "src/components/analytics/MultiRegionBenchmark.tsx" "27f3f900e5274e304961b534bf2843b0cf424244c0176a7c7c787b355cf4d268"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/__tests__/EventAnnotations.test.tsx" "src/components/analytics/__tests__/EventAnnotations.test.tsx" "7995152462c13ffd53762a66f2e97822dfc25f45eaff26964b02eca4b0704005"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/__tests__/TrendChart.test.tsx" "src/components/analytics/__tests__/TrendChart.test.tsx" "81ac900a9c4879472b13b049a662af6f3da941fd1e3bfceebc98a06377d6898e"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/analytics/__tests__/TrendFilters.test.tsx" "src/components/analytics/__tests__/TrendFilters.test.tsx" "acf67ddf118bbc5ea20c16ac9231baaa71defcb5826a3b5fc9054b5bfafac0d6"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/ActionModal.tsx" "src/components/dashboard/ActionModal.tsx" "d308118ddd90c4b357ed3856b6e6de00bbfed55fc4be3b8e6e87369f2aaf70f6"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/GA4Chart.tsx" "src/components/dashboard/GA4Chart.tsx" "4f1a89a419e0ad512e142308c22ad450fd0fbfd5b1318f67e052f88dd0ede4d0"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/GMBChart.tsx" "src/components/dashboard/GMBChart.tsx" "ef53f0614c4c8a17981219a7bdefdf325222e2dda96103e89e3a0cb304ba8f27"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/PromoCodeSection.tsx" "src/components/dashboard/PromoCodeSection.tsx" "9962c3eea62e17de6d48431950349431dc773e115286ec944ecd00d8334111e9"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/QuickActionButton.tsx" "src/components/dashboard/QuickActionButton.tsx" "6d76298ccdd2186026e8b50963a4323560bf27e09e20674acf183628e78f8c8a"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/QuotaWidget.tsx" "src/components/dashboard/QuotaWidget.tsx" "ba11286afe4d43b9962d0eddbc380d1292bfb504d28f524cc7d81e36b6373f84"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/SocialMediaChart.tsx" "src/components/dashboard/SocialMediaChart.tsx" "d11bbc8f3e94aa169d0a92b4e2df5502f8db58c9c8b1f0a4e2706cd7b925408d"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/dashboard/restaurant/widgets/LocationOverviewWidget.tsx" "src/components/dashboard/restaurant/widgets/LocationOverviewWidget.tsx" "718c27ec5f12d885adce18fc661a12aad3ed0e9c51fe9e2b0406afe62d2debb2"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/AiSuggestionCard.tsx" "src/components/onboarding/AiSuggestionCard.tsx" "8072438777888252772aecd88de63008478ad7d3f8ef3eefaea819f19f95fea0"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/DynamicQuestionField.tsx" "src/components/onboarding/DynamicQuestionField.tsx" "5d39dc9fb56c7e3a3d3e0f25ef5177155eb4d94b22f983ffb5f00d824b1ebc9f"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/EnhancedBusinessContactStep.tsx" "src/components/onboarding/EnhancedBusinessContactStep.tsx" "ad4d63075dd0c4b469108e715992187bf7dccecb7589cb9062dd01c2dc08a9b8"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/GmailSetupGuide.tsx" "src/components/onboarding/GmailSetupGuide.tsx" "3ee5eb7f8f341704685f90556eb06fcd86baedfad803326c27add4b061528b8f"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/SmartOnboardingWizard.tsx" "src/components/onboarding/SmartOnboardingWizard.tsx" "bb72c63da8c2e6bc07842f936d1e05bfcc56a2e5733d3356b0d31dc019784318"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/onboarding/SmartQuestionField.tsx" "src/components/onboarding/SmartQuestionField.tsx" "fe94a7b78f5090ea28e5efd7ae2d07c3cae9fc9c91eea7dd1beb811114257a98"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/recommendations/GoalRecommendationsWidget.tsx" "src/components/recommendations/GoalRecommendationsWidget.tsx" "d9a5cf30ad8b56b57e7269b7635dd061ff16076e3c387a82ca38c2e02bdf6a28"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/redeem/RedeemCodeForm.tsx" "src/components/redeem/RedeemCodeForm.tsx" "edd36a6a6ded300ba830bbdd70a418f313bddec50ddad15e811fdde7057e2002"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/aspect-ratio.tsx" "src/components/ui/aspect-ratio.tsx" "08b0aa0b05efc573c7d63363c03e83d4b101bfeb54140764e96ddea30659cfcc"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/breadcrumb.tsx" "src/components/ui/breadcrumb.tsx" "abb80a6662087bdb01a70e731bd4e140bc37ae45c4ca39c268e1327cec3aedcf"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/calendar.tsx" "src/components/ui/calendar.tsx" "212fea734954d87c7f932a98aa2b5805a75e4501be431e6a09c8e8d209174677"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/carousel.tsx" "src/components/ui/carousel.tsx" "5a4ff73c804e86c873382da80c453f1399006326ef042fb984c24162ec86666e"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/drawer.tsx" "src/components/ui/drawer.tsx" "47ff6248307a4ac09bf7e00181a2a29f9f846691092e04cad03e15d749bc249b"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/hover-card.tsx" "src/components/ui/hover-card.tsx" "f877605d6ca646301df880f38796980bd62594cd3d0089c689e17399fbf0cb14"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/input-otp.tsx" "src/components/ui/input-otp.tsx" "b06b6294edee39d817586b3cf4766de1720b06e184624d45d2bfd0f38d2a5e72"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/menubar.tsx" "src/components/ui/menubar.tsx" "dcf6ae1f54565c610fa5c80ed58550fe28e75c236592d21e655da1357ef10e5a"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/navigation-menu.tsx" "src/components/ui/navigation-menu.tsx" "c07f503f41162b190bef100ba0ad31a8eaa9c790f3f782ba7df220e26f23b93a"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/pagination.tsx" "src/components/ui/pagination.tsx" "6d66283fc04f3901772f15f3108bda732efc75ce878e0d8ecf8f9fc3b0c63c26"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/radio-group.tsx" "src/components/ui/radio-group.tsx" "74f87531da1fde8d3c07dbd7b380ee6508a70d5c0af1c22e2d2c33d66cc79f10"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/resizable.tsx" "src/components/ui/resizable.tsx" "be7df63b7584141a34dcf86648e2528bbd56125661ef0f31850bb961a8e6f9a3"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/scroll-area.tsx" "src/components/ui/scroll-area.tsx" "d7d02600effca55d0dcadce8c09c97ebddda3a19c5fa1d52dc9f6f727b26c6b1"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/toggle-group.tsx" "src/components/ui/toggle-group.tsx" "11592e3f7673ef518e2f82b939dc4752fe5ef7953f487f35595931c3d16fc37d"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/ui/upload-demo.tsx" "src/components/ui/upload-demo.tsx" "4cea6dc88a1c1a84018c808656a96b1e54c0f77d46222229fd2e1a1d0e1f09fb"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/visibility/InstagramCandidatePicker.tsx" "src/components/visibility/InstagramCandidatePicker.tsx" "85ddb8d850bfbcb1f739a9128e5ea8adc7d27faac140680d935544f19e247513"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/components/visibility/VisibilityCheckPage.tsx" "src/components/visibility/VisibilityCheckPage.tsx" "e2122a07f79e2a22733c550e283186e6a3791bef7266f00e31b20eab52562cc4"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/__tests__/todoGenerator.test.ts" "src/lib/__tests__/todoGenerator.test.ts" "ef3cbd6487f64fbc246d53da198a5880d6dba765b0027dcbbca07c5a484e5352"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts" "src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts" "4bab1426ef6a5da8a929c497a9815d09be0c584050210545a2d80870c19c9187"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts" "src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts" "4d4a80ca455012e5043a6619f1fd0215db14772296822a1247a58d20c19ef6ae"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/architecture-scanner/index.ts" "src/lib/architecture-scanner/index.ts" "67517ce84909b4725185c5ce17fbfcc36b3e44ea9cd59e2c0e1b8c3ce753680a"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/architecture-scanner/risk-matrix.ts" "src/lib/architecture-scanner/risk-matrix.ts" "b996f24e80d015acd3342f723de5c08982faba8b23784e4dd9d9f960928e344c"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/forecast/__tests__/forecastEngine.test.ts" "src/lib/forecast/__tests__/forecastEngine.test.ts" "c39925488a647486962eb589c16327fce5887487360ee6c0fd70b7c39c79a35c"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/forecast/index.ts" "src/lib/forecast/index.ts" "33c860957c898cf8261a1ed30c3be4fea463763b3cad8c3cdd2529fb538b22be"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/normalizeSocialUrls.ts" "src/lib/normalizeSocialUrls.ts" "0b7fc183a57411ab1c56db7aa247f8f6fecf6d78919ae0d69dc93cd1f10f5d22"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/pdfReport.ts" "src/lib/pdfReport.ts" "6c038ee31746dcc079cc4ccf98b579e5ddd410b43c220f350a7dde7bceae6f3d"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/recommendation/__tests__/recommendationTrigger.test.ts" "src/lib/recommendation/__tests__/recommendationTrigger.test.ts" "afbedac14d8109618c8df0f5436330408bdafccf264454645bd7d3b774b60905"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/todoGenerator.ts" "src/lib/todoGenerator.ts" "b5f40c12b44e3d6de461393eea9a6aa824a688bcf5370e1a1549bf23a39b735f"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/lib/translations/resources.ts" "src/lib/translations/resources.ts" "594ea4696540031fae9ccd22d846ec7fed78db6f7f6f7f6b380dada626113996"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/ProfileService.ts" "src/services/ProfileService.ts" "b6b26fb420af1d76700ea3e82b7adba775cb8c89e694bc7659769cf9cedb7db7"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/VisibilityCheckService.ts" "src/services/VisibilityCheckService.ts" "d4078a62817743e7b34dfd01403877252f902619d3c86e65524b87d18b619c1f"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/__tests__/ProfileService.test.ts" "src/services/__tests__/ProfileService.test.ts" "43d3c0038485eaa80a4ec1dca7e307fb5e64c826804ef6f269ceb3ff4110533b"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/__tests__/aws-rds-client.test.ts" "src/services/__tests__/aws-rds-client.test.ts" "ed4e4550e8aca7d4943f3be330a38fc1135e1d164dbfb53790101c46d3929ea8"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/__tests__/benchmark-comparison.test.ts" "src/services/__tests__/benchmark-comparison.test.ts" "6fa5934af3c3888ac43dabba8bc000af747d94332772cd06d9724caa7c56d3fa"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/__tests__/forecasting-engine.test.ts" "src/services/__tests__/forecasting-engine.test.ts" "370c04034c7fa69b27916fb2c16ff4d0d29e91b0fa0c9d22f2f97ccc32584ff5"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/__tests__/score-history.test.ts" "src/services/__tests__/score-history.test.ts" "c0e0031946c5200a6109242cc32a8dacfbb3d6076e60631046d2f78bb4cb16de"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/services/forecasting-engine.ts" "src/services/forecasting-engine.ts" "6a3b5dc3d99654bf27afe4a413447e25492e6731b48424099852278546cb112b"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/index.ts" "src/hooks/index.ts" "d388983e97f2d32e3ec2c4e2aac806cdce24d32a6a538db118a1b36e258b3561"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useAiCategorySuggestions.ts" "src/hooks/useAiCategorySuggestions.ts" "ef70964006737e9186b0ce70cf90bf5277851537c41be90bcccde74c976e2387"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useAppState.ts" "src/hooks/useAppState.ts" "1df35a275f923d6449faa6e8b4a45da439916cd38b488bd47d8c9eafe4922816"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useDiversifiedCategorySelection.ts" "src/hooks/useDiversifiedCategorySelection.ts" "46c09ce90ae08f2edd871fda48b9796568f03af383c999e7fc6cc7f15c891559"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useFacebookEventTemplates.ts" "src/hooks/useFacebookEventTemplates.ts" "e94137e80b190f6653a35386e2ea55da70d876186d1cf806e7efc3eed2109d71"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useI18nDebug.tsx" "src/hooks/useI18nDebug.tsx" "86b9d2f5eb0913c4c296c9612f2da9fc2012cfa8aa5ae972670a714755fb0d37"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useI18nValidation.ts" "src/hooks/useI18nValidation.ts" "f9e106dae85eab4a4e656f63437c90bf5267a1c59af9722bebbfa995a3de345d"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useLanguage.ts" "src/hooks/useLanguage.ts" "a91ad6416ed9076098ac94e38b89ac4b30c4f4999e55c361641a1e7743a4fa00"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useRealtimeConnection.ts" "src/hooks/useRealtimeConnection.ts" "4b2404b9d0628bc9f8b32ff64571e3fbfc02a6e1e27a36bf7de6d40cbb6c8669"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useSmartCategorySelection.ts" "src/hooks/useSmartCategorySelection.ts" "fa6a2dd115850b92449b740c472052d0def63d68397ab4c99d5a664e448c8b08"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useSyncGa4.ts" "src/hooks/useSyncGa4.ts" "bec26553431a0433fdde94292d1f2d6143ca99c6468276048ea96ccd2cd63b4b"
restore_component "src/archive/legacy-cleanup-2025-09-18/src/hooks/useSyncGmb.ts" "src/hooks/useSyncGmb.ts" "aada0f8673658a37c627c8fb9006a4a64a081f0d5039fd1c03119318d7408bbd"

# Remove symlinks if they exist


# Run validation checks
echo "🧪 Running validation checks..."
echo "Checking: TypeScript Compilation" && npx tsc --noEmit
echo "Checking: Build Process" && npm run build
echo "Checking: Import Resolution" && npx eslint --ext .ts,.tsx src/ --no-eslintrc --config .eslintrc.imports.js

echo "✅ Rollback completed successfully!"
echo "📋 Restored 79 components"
echo "🔍 Please verify application functionality"
