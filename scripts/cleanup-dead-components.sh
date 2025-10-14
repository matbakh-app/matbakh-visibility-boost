#!/bin/bash

# Dead Component Cleanup Script
# Generated: 2025-09-14T15:32:23.954Z
# 
# This script removes low-risk dead components.
# ALWAYS review the list before running!

set -e

echo "🧹 Dead Component Cleanup"
echo "========================="
echo ""
echo "This will remove 122 low-risk dead components."
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "🗑️ Removing dead components..."


# Remove: sidebar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/sidebar.tsx" ]; then
    echo "Removing src/components/ui/sidebar.tsx..."
    rm "src/components/ui/sidebar.tsx"
else
    echo "⚠️ File not found: src/components/ui/sidebar.tsx"
fi

# Remove: sidebar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/sidebar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/sidebar.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/sidebar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/sidebar.tsx"
fi

# Remove: sidebar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/sidebar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/sidebar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/sidebar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/sidebar.tsx"
fi

# Remove: sidebar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/sidebar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/sidebar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/sidebar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/sidebar.tsx"
fi

# Remove: VisibilityResultsEnhanced (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/visibility/VisibilityResultsEnhanced.tsx" ]; then
    echo "Removing src/components/visibility/VisibilityResultsEnhanced.tsx..."
    rm "src/components/visibility/VisibilityResultsEnhanced.tsx"
else
    echo "⚠️ File not found: src/components/visibility/VisibilityResultsEnhanced.tsx"
fi

# Remove: file-preview-modal (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/file-preview-modal.tsx" ]; then
    echo "Removing src/components/ui/file-preview-modal.tsx..."
    rm "src/components/ui/file-preview-modal.tsx"
else
    echo "⚠️ File not found: src/components/ui/file-preview-modal.tsx"
fi

# Remove: webWorkerManager (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/webWorkerManager.ts" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/webWorkerManager.ts..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/webWorkerManager.ts"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/webWorkerManager.ts"
fi

# Remove: webWorkerManager (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/webWorkerManager.ts" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/webWorkerManager.ts..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/webWorkerManager.ts"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/webWorkerManager.ts"
fi

# Remove: FigmaTextDemo (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/FigmaTextDemo.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/FigmaTextDemo.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/FigmaTextDemo.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/FigmaTextDemo.tsx"
fi

# Remove: cacheManager (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/cacheManager.ts" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/cacheManager.ts..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/cacheManager.ts"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/cacheManager.ts"
fi

# Remove: cacheManager (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/cacheManager.ts" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/cacheManager.ts..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/cacheManager.ts"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/cacheManager.ts"
fi

# Remove: DesignSystemDemo (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/DesignSystemDemo.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/DesignSystemDemo.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/DesignSystemDemo.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/DesignSystemDemo.tsx"
fi

# Remove: DesignSystemDemo (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/DesignSystemDemo.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/DesignSystemDemo.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/DesignSystemDemo.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/DesignSystemDemo.tsx"
fi

# Remove: QualityChecklist (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/QualityChecklist.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/QualityChecklist.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/QualityChecklist.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/QualityChecklist.tsx"
fi

# Remove: QualityChecklist (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/QualityChecklist.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/QualityChecklist.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/QualityChecklist.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/QualityChecklist.tsx"
fi

# Remove: KpiGrid (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/KpiGrid.tsx" ]; then
    echo "Removing src/components/dashboard/KpiGrid.tsx..."
    rm "src/components/dashboard/KpiGrid.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/KpiGrid.tsx"
fi

# Remove: menubar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/menubar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/menubar.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/menubar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/menubar.tsx"
fi

# Remove: menubar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/menubar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/menubar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/menubar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/menubar.tsx"
fi

# Remove: menubar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/menubar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/menubar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/menubar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/menubar.tsx"
fi

# Remove: context-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/context-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/context-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/context-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/context-menu.tsx"
fi

# Remove: context-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/context-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/context-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/context-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/context-menu.tsx"
fi

# Remove: context-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/context-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/context-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/context-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/context-menu.tsx"
fi

# Remove: menubar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/menubar.tsx" ]; then
    echo "Removing src/components/ui/menubar.tsx..."
    rm "src/components/ui/menubar.tsx"
else
    echo "⚠️ File not found: src/components/ui/menubar.tsx"
fi

# Remove: facebookEventHelpers (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/utils/facebookEventHelpers.ts" ]; then
    echo "Removing src/utils/facebookEventHelpers.ts..."
    rm "src/utils/facebookEventHelpers.ts"
else
    echo "⚠️ File not found: src/utils/facebookEventHelpers.ts"
fi

# Remove: context-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/context-menu.tsx" ]; then
    echo "Removing src/components/ui/context-menu.tsx..."
    rm "src/components/ui/context-menu.tsx"
else
    echo "⚠️ File not found: src/components/ui/context-menu.tsx"
fi

# Remove: EnhancedBusinessContactStep (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/onboarding/EnhancedBusinessContactStep.tsx" ]; then
    echo "Removing src/components/onboarding/EnhancedBusinessContactStep.tsx..."
    rm "src/components/onboarding/EnhancedBusinessContactStep.tsx"
else
    echo "⚠️ File not found: src/components/onboarding/EnhancedBusinessContactStep.tsx"
fi

# Remove: navigation-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/navigation-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/navigation-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/navigation-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/navigation-menu.tsx"
fi

# Remove: navigation-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/navigation-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/navigation-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/navigation-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/navigation-menu.tsx"
fi

# Remove: navigation-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/navigation-menu.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/navigation-menu.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/navigation-menu.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/navigation-menu.tsx"
fi

# Remove: ActionModal (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/ActionModal.tsx" ]; then
    echo "Removing src/components/dashboard/ActionModal.tsx..."
    rm "src/components/dashboard/ActionModal.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/ActionModal.tsx"
fi

# Remove: SmartQuestionField (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/onboarding/SmartQuestionField.tsx" ]; then
    echo "Removing src/components/onboarding/SmartQuestionField.tsx..."
    rm "src/components/onboarding/SmartQuestionField.tsx"
else
    echo "⚠️ File not found: src/components/onboarding/SmartQuestionField.tsx"
fi

# Remove: carousel (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/carousel.tsx" ]; then
    echo "Removing src/components/ui/carousel.tsx..."
    rm "src/components/ui/carousel.tsx"
else
    echo "⚠️ File not found: src/components/ui/carousel.tsx"
fi

# Remove: CampaignReport (Component)
# Reasons: No incoming imports, Not a route component, No tests found, Marked with dead code hints
if [ -f "src/components/redeem/CampaignReport.tsx" ]; then
    echo "Removing src/components/redeem/CampaignReport.tsx..."
    rm "src/components/redeem/CampaignReport.tsx"
else
    echo "⚠️ File not found: src/components/redeem/CampaignReport.tsx"
fi

# Remove: carousel (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/carousel.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/carousel.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/carousel.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/carousel.tsx"
fi

# Remove: carousel (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/carousel.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/carousel.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/carousel.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/carousel.tsx"
fi

# Remove: carousel (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/carousel.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/carousel.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/carousel.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/carousel.tsx"
fi

# Remove: SmartOnboardingWizard (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/onboarding/SmartOnboardingWizard.tsx" ]; then
    echo "Removing src/components/onboarding/SmartOnboardingWizard.tsx..."
    rm "src/components/onboarding/SmartOnboardingWizard.tsx"
else
    echo "⚠️ File not found: src/components/onboarding/SmartOnboardingWizard.tsx"
fi

# Remove: PromoCodeSection (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/PromoCodeSection.tsx" ]; then
    echo "Removing src/components/dashboard/PromoCodeSection.tsx..."
    rm "src/components/dashboard/PromoCodeSection.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/PromoCodeSection.tsx"
fi

# Remove: navigation-menu (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/navigation-menu.tsx" ]; then
    echo "Removing src/components/ui/navigation-menu.tsx..."
    rm "src/components/ui/navigation-menu.tsx"
else
    echo "⚠️ File not found: src/components/ui/navigation-menu.tsx"
fi

# Remove: InstagramCandidatePicker (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/visibility/InstagramCandidatePicker.tsx" ]; then
    echo "Removing src/components/visibility/InstagramCandidatePicker.tsx..."
    rm "src/components/visibility/InstagramCandidatePicker.tsx"
else
    echo "⚠️ File not found: src/components/visibility/InstagramCandidatePicker.tsx"
fi

# Remove: RedeemCodeForm (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/redeem/RedeemCodeForm.tsx" ]; then
    echo "Removing src/components/redeem/RedeemCodeForm.tsx..."
    rm "src/components/redeem/RedeemCodeForm.tsx"
else
    echo "⚠️ File not found: src/components/redeem/RedeemCodeForm.tsx"
fi

# Remove: toast (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/toast.tsx" ]; then
    echo "Removing src/components/ui/toast.tsx..."
    rm "src/components/ui/toast.tsx"
else
    echo "⚠️ File not found: src/components/ui/toast.tsx"
fi

# Remove: VCResultInvisible (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/invisible/VCResultInvisible.tsx" ]; then
    echo "Removing src/components/invisible/VCResultInvisible.tsx..."
    rm "src/components/invisible/VCResultInvisible.tsx"
else
    echo "⚠️ File not found: src/components/invisible/VCResultInvisible.tsx"
fi

# Remove: DynamicQuestionField (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/onboarding/DynamicQuestionField.tsx" ]; then
    echo "Removing src/components/onboarding/DynamicQuestionField.tsx..."
    rm "src/components/onboarding/DynamicQuestionField.tsx"
else
    echo "⚠️ File not found: src/components/onboarding/DynamicQuestionField.tsx"
fi

# Remove: onboardingGuard (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/guards/onboardingGuard.ts" ]; then
    echo "Removing src/guards/onboardingGuard.ts..."
    rm "src/guards/onboardingGuard.ts"
else
    echo "⚠️ File not found: src/guards/onboardingGuard.ts"
fi

# Remove: StepCard (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/StepCard.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/StepCard.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/StepCard.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/StepCard.tsx"
fi

# Remove: drawer (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/drawer.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/drawer.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/drawer.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/drawer.tsx"
fi

# Remove: drawer (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/drawer.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/drawer.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/drawer.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/drawer.tsx"
fi

# Remove: drawer (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/drawer.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/drawer.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/drawer.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/drawer.tsx"
fi

# Remove: performanceMonitor (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/performanceMonitor.ts" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/performanceMonitor.ts..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/performanceMonitor.ts"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/performanceMonitor.ts"
fi

# Remove: FacebookTestComponent (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/FacebookTestComponent.tsx" ]; then
    echo "Removing src/components/FacebookTestComponent.tsx..."
    rm "src/components/FacebookTestComponent.tsx"
else
    echo "⚠️ File not found: src/components/FacebookTestComponent.tsx"
fi

# Remove: QuickActions (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/QuickActions.tsx" ]; then
    echo "Removing src/components/dashboard/QuickActions.tsx..."
    rm "src/components/dashboard/QuickActions.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/QuickActions.tsx"
fi

# Remove: todoGenerator (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/lib/todoGenerator.ts" ]; then
    echo "Removing src/lib/todoGenerator.ts..."
    rm "src/lib/todoGenerator.ts"
else
    echo "⚠️ File not found: src/lib/todoGenerator.ts"
fi

# Remove: HowItWorksSection (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/HowItWorksSection.tsx" ]; then
    echo "Removing src/components/HowItWorksSection.tsx..."
    rm "src/components/HowItWorksSection.tsx"
else
    echo "⚠️ File not found: src/components/HowItWorksSection.tsx"
fi

# Remove: score-history (Type)
# Reasons: Not a route component, Not Kiro-relevant, No tests found, Marked with dead code hints
if [ -f "src/types/score-history.ts" ]; then
    echo "Removing src/types/score-history.ts..."
    rm "src/types/score-history.ts"
else
    echo "⚠️ File not found: src/types/score-history.ts"
fi

# Remove: drawer (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/drawer.tsx" ]; then
    echo "Removing src/components/ui/drawer.tsx..."
    rm "src/components/ui/drawer.tsx"
else
    echo "⚠️ File not found: src/components/ui/drawer.tsx"
fi

# Remove: calendar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/calendar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/calendar.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/calendar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/calendar.tsx"
fi

# Remove: calendar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/calendar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/calendar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/calendar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/calendar.tsx"
fi

# Remove: calendar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/calendar.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/calendar.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/calendar.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/calendar.tsx"
fi

# Remove: pagination (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/pagination.tsx" ]; then
    echo "Removing src/components/ui/pagination.tsx..."
    rm "src/components/ui/pagination.tsx"
else
    echo "⚠️ File not found: src/components/ui/pagination.tsx"
fi

# Remove: pagination (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/pagination.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/pagination.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/pagination.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/pagination.tsx"
fi

# Remove: pagination (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/pagination.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/pagination.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/pagination.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/pagination.tsx"
fi

# Remove: pagination (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/pagination.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/pagination.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/pagination.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/pagination.tsx"
fi

# Remove: breadcrumb (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/breadcrumb.tsx" ]; then
    echo "Removing src/components/ui/breadcrumb.tsx..."
    rm "src/components/ui/breadcrumb.tsx"
else
    echo "⚠️ File not found: src/components/ui/breadcrumb.tsx"
fi

# Remove: TrustSection (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/TrustSection.tsx" ]; then
    echo "Removing src/components/TrustSection.tsx..."
    rm "src/components/TrustSection.tsx"
else
    echo "⚠️ File not found: src/components/TrustSection.tsx"
fi

# Remove: calendar (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/calendar.tsx" ]; then
    echo "Removing src/components/ui/calendar.tsx..."
    rm "src/components/ui/calendar.tsx"
else
    echo "⚠️ File not found: src/components/ui/calendar.tsx"
fi

# Remove: navigationValidator (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/lib/navigationValidator.ts" ]; then
    echo "Removing src/lib/navigationValidator.ts..."
    rm "src/lib/navigationValidator.ts"
else
    echo "⚠️ File not found: src/lib/navigationValidator.ts"
fi

# Remove: CheckoutButton (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/CheckoutButton.tsx" ]; then
    echo "Removing src/components/CheckoutButton.tsx..."
    rm "src/components/CheckoutButton.tsx"
else
    echo "⚠️ File not found: src/components/CheckoutButton.tsx"
fi

# Remove: breadcrumb (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/breadcrumb.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/breadcrumb.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/breadcrumb.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/breadcrumb.tsx"
fi

# Remove: breadcrumb (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/breadcrumb.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/breadcrumb.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/breadcrumb.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/breadcrumb.tsx"
fi

# Remove: TimeSelector (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/TimeSelector.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/TimeSelector.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/TimeSelector.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/TimeSelector.tsx"
fi

# Remove: TimeSelector (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/TimeSelector.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/TimeSelector.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/TimeSelector.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/TimeSelector.tsx"
fi

# Remove: pdfReport (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/lib/pdfReport.ts" ]; then
    echo "Removing src/lib/pdfReport.ts..."
    rm "src/lib/pdfReport.ts"
else
    echo "⚠️ File not found: src/lib/pdfReport.ts"
fi

# Remove: normalizeSocialUrls (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/lib/normalizeSocialUrls.ts" ]; then
    echo "Removing src/lib/normalizeSocialUrls.ts..."
    rm "src/lib/normalizeSocialUrls.ts"
else
    echo "⚠️ File not found: src/lib/normalizeSocialUrls.ts"
fi

# Remove: TestimonialSection (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/TestimonialSection.tsx" ]; then
    echo "Removing src/components/TestimonialSection.tsx..."
    rm "src/components/TestimonialSection.tsx"
else
    echo "⚠️ File not found: src/components/TestimonialSection.tsx"
fi

# Remove: input-otp (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/input-otp.tsx" ]; then
    echo "Removing src/components/ui/input-otp.tsx..."
    rm "src/components/ui/input-otp.tsx"
else
    echo "⚠️ File not found: src/components/ui/input-otp.tsx"
fi

# Remove: accordion (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/accordion.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/accordion.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/accordion.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/accordion.tsx"
fi

# Remove: accordion (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/accordion.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/accordion.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/accordion.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/accordion.tsx"
fi

# Remove: accordion (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/accordion.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/accordion.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/accordion.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/accordion.tsx"
fi

# Remove: resizable (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/resizable.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/resizable.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/resizable.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/resizable.tsx"
fi

# Remove: resizable (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/resizable.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/resizable.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/resizable.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/resizable.tsx"
fi

# Remove: resizable (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/resizable.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/resizable.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/resizable.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/resizable.tsx"
fi

# Remove: SocialMediaChart (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/SocialMediaChart.tsx" ]; then
    echo "Removing src/components/dashboard/SocialMediaChart.tsx..."
    rm "src/components/dashboard/SocialMediaChart.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/SocialMediaChart.tsx"
fi

# Remove: accordion (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/accordion.tsx" ]; then
    echo "Removing src/components/ui/accordion.tsx..."
    rm "src/components/ui/accordion.tsx"
else
    echo "⚠️ File not found: src/components/ui/accordion.tsx"
fi

# Remove: VisibilityCheckPage (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/visibility/VisibilityCheckPage.tsx" ]; then
    echo "Removing src/components/visibility/VisibilityCheckPage.tsx..."
    rm "src/components/visibility/VisibilityCheckPage.tsx"
else
    echo "⚠️ File not found: src/components/visibility/VisibilityCheckPage.tsx"
fi

# Remove: toggle-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/toggle-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/toggle-group.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/toggle-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/toggle-group.tsx"
fi

# Remove: toggle-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/toggle-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/toggle-group.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/toggle-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/toggle-group.tsx"
fi

# Remove: toggle-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/toggle-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/toggle-group.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/toggle-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/toggle-group.tsx"
fi

# Remove: GA4Chart (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/GA4Chart.tsx" ]; then
    echo "Removing src/components/dashboard/GA4Chart.tsx..."
    rm "src/components/dashboard/GA4Chart.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/GA4Chart.tsx"
fi

# Remove: toggle-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/toggle-group.tsx" ]; then
    echo "Removing src/components/ui/toggle-group.tsx..."
    rm "src/components/ui/toggle-group.tsx"
else
    echo "⚠️ File not found: src/components/ui/toggle-group.tsx"
fi

# Remove: resizable (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/resizable.tsx" ]; then
    echo "Removing src/components/ui/resizable.tsx..."
    rm "src/components/ui/resizable.tsx"
else
    echo "⚠️ File not found: src/components/ui/resizable.tsx"
fi

# Remove: scroll-area (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/scroll-area.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/scroll-area.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/scroll-area.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/scroll-area.tsx"
fi

# Remove: scroll-area (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/scroll-area.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/scroll-area.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/scroll-area.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/scroll-area.tsx"
fi

# Remove: scroll-area (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/scroll-area.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/scroll-area.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/scroll-area.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/scroll-area.tsx"
fi

# Remove: scroll-area (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/scroll-area.tsx" ]; then
    echo "Removing src/components/ui/scroll-area.tsx..."
    rm "src/components/ui/scroll-area.tsx"
else
    echo "⚠️ File not found: src/components/ui/scroll-area.tsx"
fi

# Remove: GMBChart (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/GMBChart.tsx" ]; then
    echo "Removing src/components/dashboard/GMBChart.tsx..."
    rm "src/components/dashboard/GMBChart.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/GMBChart.tsx"
fi

# Remove: breadcrumb (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/breadcrumb.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/breadcrumb.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/breadcrumb.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/breadcrumb.tsx"
fi

# Remove: QuickActionButton (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/QuickActionButton.tsx" ]; then
    echo "Removing src/components/dashboard/QuickActionButton.tsx..."
    rm "src/components/dashboard/QuickActionButton.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/QuickActionButton.tsx"
fi

# Remove: hover-card (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/hover-card.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/hover-card.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/hover-card.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/hover-card.tsx"
fi

# Remove: hover-card (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/hover-card.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/hover-card.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/hover-card.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/hover-card.tsx"
fi

# Remove: hover-card (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/hover-card.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/hover-card.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/hover-card.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/hover-card.tsx"
fi

# Remove: radio-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/radio-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/radio-group.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/radio-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/radio-group.tsx"
fi

# Remove: radio-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/radio-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/radio-group.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/radio-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/radio-group.tsx"
fi

# Remove: radio-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/radio-group.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/radio-group.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/radio-group.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/radio-group.tsx"
fi

# Remove: radio-group (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/radio-group.tsx" ]; then
    echo "Removing src/components/ui/radio-group.tsx..."
    rm "src/components/ui/radio-group.tsx"
else
    echo "⚠️ File not found: src/components/ui/radio-group.tsx"
fi

# Remove: SeoHead (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/SeoHead.tsx" ]; then
    echo "Removing src/components/SeoHead.tsx..."
    rm "src/components/SeoHead.tsx"
else
    echo "⚠️ File not found: src/components/SeoHead.tsx"
fi

# Remove: VisibilityCheckSection (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/VisibilityCheckSection.tsx" ]; then
    echo "Removing src/components/VisibilityCheckSection.tsx..."
    rm "src/components/VisibilityCheckSection.tsx"
else
    echo "⚠️ File not found: src/components/VisibilityCheckSection.tsx"
fi

# Remove: hover-card (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/hover-card.tsx" ]; then
    echo "Removing src/components/ui/hover-card.tsx..."
    rm "src/components/ui/hover-card.tsx"
else
    echo "⚠️ File not found: src/components/ui/hover-card.tsx"
fi

# Remove: ImageWithFallback (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/figma/ImageWithFallback.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/figma/ImageWithFallback.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/figma/ImageWithFallback.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/figma/ImageWithFallback.tsx"
fi

# Remove: ImageWithFallback (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/figma/ImageWithFallback.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/figma/ImageWithFallback.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/figma/ImageWithFallback.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/figma/ImageWithFallback.tsx"
fi

# Remove: ImageWithFallback (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/figma/ImageWithFallback.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/figma/ImageWithFallback.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/figma/ImageWithFallback.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/figma/ImageWithFallback.tsx"
fi

# Remove: QuotaWidget (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/dashboard/QuotaWidget.tsx" ]; then
    echo "Removing src/components/dashboard/QuotaWidget.tsx..."
    rm "src/components/dashboard/QuotaWidget.tsx"
else
    echo "⚠️ File not found: src/components/dashboard/QuotaWidget.tsx"
fi

# Remove: ForecastChart-legacy (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/analytics/ForecastChart-legacy.tsx" ]; then
    echo "Removing src/components/analytics/ForecastChart-legacy.tsx..."
    rm "src/components/analytics/ForecastChart-legacy.tsx"
else
    echo "⚠️ File not found: src/components/analytics/ForecastChart-legacy.tsx"
fi

# Remove: businessPartner (Type)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/types/businessPartner.ts" ]; then
    echo "Removing src/types/businessPartner.ts..."
    rm "src/types/businessPartner.ts"
else
    echo "⚠️ File not found: src/types/businessPartner.ts"
fi

# Remove: DashboardLayout (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/useless/components/layout/DashboardLayout.tsx" ]; then
    echo "Removing src/useless/components/layout/DashboardLayout.tsx..."
    rm "src/useless/components/layout/DashboardLayout.tsx"
else
    echo "⚠️ File not found: src/useless/components/layout/DashboardLayout.tsx"
fi

# Remove: timeGreeting (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/utils/timeGreeting.ts" ]; then
    echo "Removing src/utils/timeGreeting.ts..."
    rm "src/utils/timeGreeting.ts"
else
    echo "⚠️ File not found: src/utils/timeGreeting.ts"
fi

# Remove: aspect-ratio (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/aspect-ratio.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/aspect-ratio.tsx..."
    rm "src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/aspect-ratio.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/aspect-ratio.tsx"
fi

# Remove: aspect-ratio (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/aspect-ratio.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/aspect-ratio.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/aspect-ratio.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/aspect-ratio.tsx"
fi

# Remove: aspect-ratio (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/aspect-ratio.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/aspect-ratio.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/aspect-ratio.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/aspect-ratio.tsx"
fi

# Remove: DevelopmentTestingCard (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/DevelopmentTestingCard.tsx" ]; then
    echo "Removing src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/DevelopmentTestingCard.tsx..."
    rm "src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/DevelopmentTestingCard.tsx"
else
    echo "⚠️ File not found: src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/DevelopmentTestingCard.tsx"
fi

# Remove: resources (Utility)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/lib/translations/resources.ts" ]; then
    echo "Removing src/lib/translations/resources.ts..."
    rm "src/lib/translations/resources.ts"
else
    echo "⚠️ File not found: src/lib/translations/resources.ts"
fi

# Remove: aspect-ratio (Component)
# Reasons: No incoming imports, Not a route component, Not Kiro-relevant, No tests found
if [ -f "src/components/ui/aspect-ratio.tsx" ]; then
    echo "Removing src/components/ui/aspect-ratio.tsx..."
    rm "src/components/ui/aspect-ratio.tsx"
else
    echo "⚠️ File not found: src/components/ui/aspect-ratio.tsx"
fi

echo ""
echo "✅ Cleanup complete!"
echo "📊 Removed 122 components"
echo "💾 Freed ~557KB"
echo ""
echo "🧪 Next steps:"
echo "1. Run tests: npm test"
echo "2. Check build: npm run build"
echo "3. Commit changes: git add -A && git commit -m 'Remove dead components'"
