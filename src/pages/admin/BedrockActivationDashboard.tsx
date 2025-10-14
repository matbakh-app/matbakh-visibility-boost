import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AiFeatureFlags, BedrockSupportModeConfig, FeatureFlagValidationResult } from "@/lib/ai-orchestrator/ai-feature-flags";
import { AlertTriangle, CheckCircle, Info, RefreshCw, Settings, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface BedrockActivationDashboardState {
    featureFlags: AiFeatureFlags;
    config: BedrockSupportModeConfig | null;
    validation: FeatureFlagValidationResult | null;
    loading: boolean;
    lastUpdated: Date | null;
    environment: "development" | "staging" | "production";
}

export default function BedrockActivationDashboard() {
    const [state, setState] = useState<BedrockActivationDashboardState>({
        featureFlags: new AiFeatureFlags(),
        config: null,
        validation: null,
        loading: true,
        lastUpdated: null,
        environment: "development"
    });

    const loadConfiguration = async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            const config = await state.featureFlags.getBedrockSupportModeConfig();
            const validation = await state.featureFlags.validateBedrockSupportModeFlags();

            setState(prev => ({
                ...prev,
                config,
                validation,
                loading: false,
                lastUpdated: new Date()
            }));
        } catch (error) {
            console.error("Failed to load Bedrock configuration:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                validation: {
                    isValid: false,
                    errors: ["Failed to load configuration"],
                    warnings: []
                }
            }));
        }
    };

    useEffect(() => {
        loadConfiguration();
    }, []);

    const handleToggleFlag = async (flagName: string, enabled: boolean) => {
        try {
            switch (flagName) {
                case "ENABLE_BEDROCK_SUPPORT_MODE":
                    if (enabled) {
                        const result = await state.featureFlags.enableBedrockSupportModeSafely();
                        if (!result.isValid) {
                            // Show validation errors
                            setState(prev => ({ ...prev, validation: result }));
                            return;
                        }
                    } else {
                        await state.featureFlags.disableBedrockSupportModeSafely();
                    }
                    break;
                case "ENABLE_INTELLIGENT_ROUTING":
                    await state.featureFlags.setIntelligentRoutingEnabled(enabled);
                    break;
                case "ENABLE_DIRECT_BEDROCK_FALLBACK":
                    await state.featureFlags.setDirectBedrockFallbackEnabled(enabled);
                    break;
                default:
                    console.warn(`Unknown flag: ${flagName}`);
                    return;
            }

            // Reload configuration after change
            await loadConfiguration();
        } catch (error) {
            console.error(`Failed to toggle ${flagName}:`, error);
        }
    };

    const handleValidateConfiguration = async () => {
        setState(prev => ({ ...prev, loading: true }));

        try {
            const validation = await state.featureFlags.validateAllFlags();
            setState(prev => ({
                ...prev,
                validation,
                loading: false,
                lastUpdated: new Date()
            }));
        } catch (error) {
            console.error("Failed to validate configuration:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                validation: {
                    isValid: false,
                    errors: ["Validation failed"],
                    warnings: []
                }
            }));
        }
    };

    const getStatusBadge = (enabled: boolean) => {
        return enabled ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Disabled
            </Badge>
        );
    };

    const getEnvironmentBadge = (environment: string) => {
        const colors = {
            development: "bg-blue-100 text-blue-800",
            staging: "bg-yellow-100 text-yellow-800",
            production: "bg-red-100 text-red-800"
        };

        return (
            <Badge variant="outline" className={colors[environment as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
                {environment.toUpperCase()}
            </Badge>
        );
    };

    if (state.loading && !state.config) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading Bedrock configuration...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold">Bedrock Activation Dashboard</h1>
                    {getEnvironmentBadge(state.config?.environment || "development")}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleValidateConfiguration}
                        disabled={state.loading}
                    >
                        {state.loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Settings className="w-4 h-4 mr-2" />
                        )}
                        Validate Config
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadConfiguration}
                        disabled={state.loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Validation Status */}
            {state.validation && (
                <div className="space-y-2">
                    {state.validation.errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium mb-1">Configuration Errors:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {state.validation.errors.map((error, index) => (
                                        <li key={index} className="text-sm">{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {state.validation.warnings.length > 0 && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium mb-1">Configuration Warnings:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {state.validation.warnings.map((warning, index) => (
                                        <li key={index} className="text-sm">{warning}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {state.validation.isValid && state.validation.errors.length === 0 && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                All feature flags are properly configured and validated.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* Feature Flag Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Core Support Mode */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-orange-600" />
                            <span>Bedrock Support Mode</span>
                            {getStatusBadge(state.config?.supportModeEnabled || false)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="font-medium">Enable Support Mode</div>
                                <div className="text-sm text-gray-600">
                                    Activates Bedrock as secondary AI operator for infrastructure support
                                </div>
                            </div>
                            <Switch
                                checked={state.config?.supportModeEnabled || false}
                                onCheckedChange={(checked) => handleToggleFlag("ENABLE_BEDROCK_SUPPORT_MODE", checked)}
                                disabled={state.loading}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="font-medium">Support Mode Features:</div>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                <li>Infrastructure auditing and gap detection</li>
                                <li>Meta-monitoring of Kiro execution</li>
                                <li>Implementation support and auto-remediation</li>
                                <li>Emergency operation support (&lt; 5s latency)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Intelligent Routing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            <span>Intelligent Routing</span>
                            {getStatusBadge(state.config?.intelligentRoutingEnabled || false)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="font-medium">Enable Intelligent Routing</div>
                                <div className="text-sm text-gray-600">
                                    Smart routing between MCP and direct Bedrock based on operation type
                                </div>
                            </div>
                            <Switch
                                checked={state.config?.intelligentRoutingEnabled || false}
                                onCheckedChange={(checked) => handleToggleFlag("ENABLE_INTELLIGENT_ROUTING", checked)}
                                disabled={state.loading}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="font-medium">Routing Matrix:</div>
                            <div className="space-y-1 text-gray-600">
                                <div>• Emergency ops → Direct Bedrock (&lt; 5s)</div>
                                <div>• Infrastructure ops → Direct Bedrock (&lt; 10s)</div>
                                <div>• Standard ops → MCP (&lt; 30s)</div>
                                <div>• Background tasks → MCP (&lt; 60s)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Direct Bedrock Fallback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            <span>Direct Bedrock Fallback</span>
                            {getStatusBadge(state.config?.directBedrockFallbackEnabled || false)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="font-medium">Enable Direct Fallback</div>
                                <div className="text-sm text-gray-600">
                                    Automatic fallback to direct Bedrock when MCP is unavailable
                                </div>
                            </div>
                            <Switch
                                checked={state.config?.directBedrockFallbackEnabled || false}
                                onCheckedChange={(checked) => handleToggleFlag("ENABLE_DIRECT_BEDROCK_FALLBACK", checked)}
                                disabled={state.loading}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="font-medium">Fallback Scenarios:</div>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                <li>MCP health check failures</li>
                                <li>MCP timeout or connectivity issues</li>
                                <li>Emergency operations requiring &lt; 5s response</li>
                                <li>Critical support operations</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Info className="w-5 h-5 text-purple-600" />
                            <span>System Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Bedrock Provider</span>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Available
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">MCP Router</span>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Operational
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">Circuit Breakers</span>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">Audit Trail</span>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Logging
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {state.lastUpdated && (
                            <div className="text-xs text-gray-500">
                                Last updated: {state.lastUpdated.toLocaleTimeString('de-DE')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Environment Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Environment Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="font-medium text-sm">Development</div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>• Support Mode: Disabled (safety)</div>
                                <div>• Intelligent Routing: Enabled (testing)</div>
                                <div>• Direct Fallback: Disabled</div>
                                <div>• Audit Interval: 5 minutes</div>
                                <div>• Monitoring: Comprehensive</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="font-medium text-sm">Staging</div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>• Support Mode: Disabled (enable for testing)</div>
                                <div>• Intelligent Routing: Enabled</div>
                                <div>• Direct Fallback: Enabled (test scenarios)</div>
                                <div>• Audit Interval: 10 minutes</div>
                                <div>• Monitoring: Detailed</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="font-medium text-sm">Production</div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div>• Support Mode: Disabled (safety first)</div>
                                <div>• Intelligent Routing: Required</div>
                                <div>• Direct Fallback: Required (reliability)</div>
                                <div>• Audit Interval: 30 minutes</div>
                                <div>• Monitoring: Basic (performance)</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}