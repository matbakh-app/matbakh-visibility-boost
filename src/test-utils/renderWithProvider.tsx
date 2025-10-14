/**
 * Render with Provider Utility
 * ----------------------------
 * Enhanced render function that automatically provides necessary context providers
 * for React components that depend on hooks like useMicroservices
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';

// Mock data for providers
const defaultMicroservicesData = {
    services: [
        {
            serviceName: 'test-service',
            status: 'healthy',
            lastCheck: new Date('2025-01-14T10:00:00Z'),
            metrics: {
                cpu: 45,
                memory: 60,
                requestRate: 120,
                errorRate: 0.5,
            },
            instances: [
                { id: 'inst-1', status: 'running' },
                { id: 'inst-2', status: 'running' },
            ],
            meshStatus: { connected: true, errors: [] },
        },
    ],
    meshStatus: {
        meshName: 'test-mesh',
        region: 'eu-central-1',
        status: 'active',
        virtualServices: 3,
        virtualRouters: 2,
        virtualNodes: 4,
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
        errors: [],
    },
    costAnalysis: {
        totalMonthlyCost: 42.5,
        budgetUtilization: 35,
        recommendations: ['Test recommendation'],
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
    },
    discoveryStats: {
        totalServices: 3,
        healthyServices: 2,
        unhealthyServices: 1,
        averageResponseTime: 85,
        servicesByEnvironment: new Map([['test', 3]]),
        servicesByRegion: new Map([['eu-central-1', 3]]),
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
    },
    isLoading: false,
    error: null,
    scaleService: jest.fn(),
    deployService: jest.fn(),
    removeService: jest.fn(),
    updateServiceConfig: jest.fn(),
    refreshData: jest.fn(),
    getServiceHealth: jest.fn(),
    getTotalCost: jest.fn(() => 42.5),
    getHealthyServicesCount: jest.fn(() => 2),
    getUnhealthyServicesCount: jest.fn(() => 1),
};

// Global mock setup for useMicroservices
const mockUseMicroservices = jest.fn(() => defaultMicroservicesData);

// Set up the mock before any imports
jest.mock('@/hooks/useMicroservices', () => ({
    __esModule: true,
    useMicroservices: mockUseMicroservices,
}));

// Provider wrapper component
interface TestProviderProps {
    children: ReactNode;
    microservicesData?: Partial<typeof defaultMicroservicesData>;
}

function TestProvider({ children, microservicesData }: TestProviderProps) {
    // Update mock data if provided
    if (microservicesData) {
        mockUseMicroservices.mockReturnValue({
            ...defaultMicroservicesData,
            ...microservicesData,
        });
    }

    return <>{children}</>;
}

// Enhanced render options
interface RenderWithProviderOptions extends Omit<RenderOptions, 'wrapper'> {
    microservicesData?: Partial<typeof defaultMicroservicesData>;
    wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Render component with necessary providers and mocks
 */
function renderWithProvider(
    ui: ReactElement,
    options: RenderWithProviderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
    const { microservicesData, wrapper, ...renderOptions } = options;

    const user = userEvent.setup();

    // Create wrapper that includes TestProvider
    const Wrapper = ({ children }: { children: ReactNode }) => {
        const content = (
            <TestProvider microservicesData={microservicesData}>
                {children}
            </TestProvider>
        );

        if (wrapper) {
            return wrapper({ children: content });
        }

        return content;
    };

    const renderResult = render(ui, {
        wrapper: Wrapper,
        ...renderOptions,
    });

    return {
        ...renderResult,
        user,
    };
}

/**
 * Update mock data for useMicroservices hook
 */
function updateMicroservicesMock(data: Partial<typeof defaultMicroservicesData>) {
    mockUseMicroservices.mockReturnValue({
        ...defaultMicroservicesData,
        ...data,
    });
}

/**
 * Reset mock to default data
 */
function resetMicroservicesMock() {
    mockUseMicroservices.mockReturnValue(defaultMicroservicesData);
}

export {
    defaultMicroservicesData,
    mockUseMicroservices, renderWithProvider, resetMicroservicesMock, updateMicroservicesMock
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { userEvent };
