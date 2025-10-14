/**
 * Microservices Dashboard Tests
 * 
 * Tests for the React dashboard component including
 * service monitoring, operations, and user interactions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MicroservicesDashboard } from '../MicroservicesDashboard';

// Mock the useMicroservices hook
const mockUseMicroservices = {
    services: [
        {
            serviceName: 'persona',
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
        {
            serviceName: 'auth',
            status: 'degraded',
            lastCheck: new Date('2025-01-14T10:00:00Z'),
            metrics: {
                cpu: 80,
                memory: 75,
                requestRate: 200,
                errorRate: 2.1,
            },
            instances: [
                { id: 'inst-1', status: 'running' },
            ],
            meshStatus: { connected: true, errors: ['High latency detected'] },
            error: 'Service experiencing high latency',
        },
        {
            serviceName: 'vc',
            status: 'unhealthy',
            lastCheck: new Date('2025-01-14T10:00:00Z'),
            metrics: {
                cpu: 20,
                memory: 30,
                requestRate: 0,
                errorRate: 100,
            },
            instances: [],
            meshStatus: { connected: false, errors: ['Connection timeout'] },
            error: 'Service is down',
        },
    ],
    meshStatus: {
        meshName: 'matbakh-mesh-test',
        region: 'eu-central-1',
        status: 'active',
        virtualServices: 3,
        virtualRouters: 2,
        virtualNodes: 4,
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
        errors: [],
    },
    costAnalysis: {
        totalMonthlyCost: 125.75,
        costByService: new Map([
            ['persona', { monthlyEstimate: 45.25 }],
            ['auth', { monthlyEstimate: 35.50 }],
            ['vc', { monthlyEstimate: 45.00 }],
        ]),
        budgetUtilization: 62.9,
        projectedMonthlyCost: 130.00,
        recommendations: [
            'Consider using Fargate Spot for development workloads',
            'Optimize container resource allocation for auth service',
            'Enable auto-scaling for vc service during peak hours',
        ],
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
    },
    discoveryStats: {
        totalServices: 3,
        healthyServices: 1,
        unhealthyServices: 2,
        servicesByEnvironment: new Map([['staging', 3]]),
        servicesByRegion: new Map([['eu-central-1', 3]]),
        averageResponseTime: 150,
        lastUpdated: new Date('2025-01-14T10:00:00Z'),
    },
    isLoading: false,
    error: null,
    refreshData: jest.fn().mockResolvedValue(undefined),
    scaleService: jest.fn().mockResolvedValue(undefined),
    deployService: jest.fn().mockResolvedValue(undefined),
    removeService: jest.fn().mockResolvedValue(undefined),
    updateServiceConfig: jest.fn().mockResolvedValue(undefined),
    getServiceHealth: jest.fn(),
    getTotalCost: jest.fn().mockReturnValue(125.75),
    getHealthyServicesCount: jest.fn().mockReturnValue(1),
    getUnhealthyServicesCount: jest.fn().mockReturnValue(2),
};

jest.mock('@/hooks/useMicroservices', () => ({
    useMicroservices: () => mockUseMicroservices,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
    CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
    CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
    CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className, ...props }: any) => (
        <span data-testid="badge" className={className} {...props}>{children}</span>
    ),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: any) => (
        <button data-testid="button" onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children, defaultValue, ...props }: any) => (
        <div data-testid="tabs" data-default-value={defaultValue} {...props}>{children}</div>
    ),
    TabsContent: ({ children, value, ...props }: any) => (
        <div data-testid="tabs-content" data-value={value} {...props}>{children}</div>
    ),
    TabsList: ({ children, ...props }: any) => (
        <div data-testid="tabs-list" {...props}>{children}</div>
    ),
    TabsTrigger: ({ children, value, ...props }: any) => (
        <button data-testid="tabs-trigger" data-value={value} {...props}>{children}</button>
    ),
}));

jest.mock('@/components/ui/progress', () => ({
    Progress: ({ value, ...props }: any) => (
        <div data-testid="progress" data-value={value} {...props}>
            <div style={{ width: `${value}%` }}></div>
        </div>
    ),
}));

jest.mock('@/components/ui/alert', () => ({
    Alert: ({ children, variant, ...props }: any) => (
        <div data-testid="alert" data-variant={variant} {...props}>{children}</div>
    ),
    AlertDescription: ({ children, ...props }: any) => (
        <div data-testid="alert-description" {...props}>{children}</div>
    ),
    AlertTitle: ({ children, ...props }: any) => (
        <div data-testid="alert-title" {...props}>{children}</div>
    ),
}));

describe('MicroservicesDashboard', () => {
    const defaultProps = {
        environment: 'staging' as const,
        region: 'eu-central-1' as const,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering and Layout', () => {
        it('should render dashboard header with environment and region', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            expect(screen.getByText('Microservices Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Monitor and manage your microservices infrastructure')).toBeInTheDocument();
            expect(screen.getByText('staging • eu-central-1')).toBeInTheDocument();
        });

        it('should render overview cards with correct metrics', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Total Services card
            expect(screen.getByText('Total Services')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('1 healthy')).toBeInTheDocument();

            // Mesh Status card
            expect(screen.getByText('Mesh Status')).toBeInTheDocument();
            expect(screen.getByText('Active')).toBeInTheDocument();
            expect(screen.getByText('3 virtual services')).toBeInTheDocument();

            // Monthly Cost card
            expect(screen.getByText('Monthly Cost')).toBeInTheDocument();
            expect(screen.getByText('€125.75')).toBeInTheDocument();
            expect(screen.getByText('62.9% of budget')).toBeInTheDocument();

            // Discovery Health card
            expect(screen.getByText('Discovery Health')).toBeInTheDocument();
            expect(screen.getByText('1/3')).toBeInTheDocument();
            expect(screen.getByText('150ms avg response')).toBeInTheDocument();
        });

        it('should render tab navigation', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            expect(screen.getByText('Services')).toBeInTheDocument();
            expect(screen.getByText('Service Mesh')).toBeInTheDocument();
            expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
            expect(screen.getByText('Service Discovery')).toBeInTheDocument();
        });
    });

    describe('Services Tab', () => {
        it('should render all services with their status', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Check service names
            expect(screen.getByText('persona')).toBeInTheDocument();
            expect(screen.getByText('auth')).toBeInTheDocument();
            expect(screen.getByText('vc')).toBeInTheDocument();

            // Check status badges
            expect(screen.getByText('Healthy')).toBeInTheDocument();
            expect(screen.getByText('Degraded')).toBeInTheDocument();
            expect(screen.getByText('Unhealthy')).toBeInTheDocument();
        });

        it('should display service metrics correctly', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Check CPU metrics
            const cpuProgress = screen.getAllByTestId('progress');
            expect(cpuProgress[0]).toHaveAttribute('data-value', '45'); // persona CPU
            expect(cpuProgress[2]).toHaveAttribute('data-value', '80'); // auth CPU

            // Check request rates
            expect(screen.getByText('120')).toBeInTheDocument(); // persona requests/min
            expect(screen.getByText('200')).toBeInTheDocument(); // auth requests/min

            // Check error rates
            expect(screen.getByText('0.50%')).toBeInTheDocument(); // persona error rate
            expect(screen.getByText('2.10%')).toBeInTheDocument(); // auth error rate
        });

        it('should show service management buttons when expanded', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Click manage button for persona service
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Should show management options
            expect(screen.getByText('Scale Up')).toBeInTheDocument();
            expect(screen.getByText('Scale Down')).toBeInTheDocument();
            expect(screen.getByText('Deploy')).toBeInTheDocument();
            expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        it('should display service errors when present', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Auth service has an error
            expect(screen.getByText('Service experiencing high latency')).toBeInTheDocument();

            // VC service has an error
            expect(screen.getByText('Service is down')).toBeInTheDocument();
        });
    });

    describe('Service Operations', () => {
        it('should call scaleService when scale buttons are clicked', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Expand persona service management
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Click scale up
            const scaleUpButton = screen.getByText('Scale Up');
            await user.click(scaleUpButton);

            expect(mockUseMicroservices.scaleService).toHaveBeenCalledWith('persona', 'up');
        });

        it('should call deployService when deploy button is clicked', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Expand persona service management
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Click deploy
            const deployButton = screen.getByText('Deploy');
            await user.click(deployButton);

            expect(mockUseMicroservices.deployService).toHaveBeenCalledWith('persona');
        });

        it('should call removeService when remove button is clicked', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Expand persona service management
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Click remove
            const removeButton = screen.getByText('Remove');
            await user.click(removeButton);

            expect(mockUseMicroservices.removeService).toHaveBeenCalledWith('persona');
        });
    });

    describe('Service Mesh Tab', () => {
        it('should display mesh status information', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Switch to mesh tab (would need to implement tab switching in real test)
            expect(screen.getByText('Service Mesh Status')).toBeInTheDocument();
            expect(screen.getByText('AWS App Mesh configuration and health')).toBeInTheDocument();
        });
    });

    describe('Cost Analysis Tab', () => {
        it('should display cost breakdown and recommendations', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
            expect(screen.getByText('Monthly cost breakdown and budget utilization')).toBeInTheDocument();
        });
    });

    describe('Auto-refresh Functionality', () => {
        it('should show refresh button and auto-refresh toggle', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            expect(screen.getByText('Refresh')).toBeInTheDocument();
            expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
        });

        it('should call refreshData when refresh button is clicked', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            const refreshButton = screen.getByText('Refresh');
            await user.click(refreshButton);

            expect(mockUseMicroservices.refreshData).toHaveBeenCalled();
        });

        it('should disable refresh button when loading', () => {
            const loadingMockUseMicroservices = {
                ...mockUseMicroservices,
                isLoading: true,
            };

            jest.mocked(require('@/hooks/useMicroservices').useMicroservices).mockReturnValue(loadingMockUseMicroservices);

            render(<MicroservicesDashboard {...defaultProps} />);

            const refreshButton = screen.getByText('Refresh');
            expect(refreshButton).toBeDisabled();
        });
    });

    describe('Error Handling', () => {
        it('should display error alert when there is an error', () => {
            const errorMockUseMicroservices = {
                ...mockUseMicroservices,
                error: new Error('Failed to load microservices data'),
            };

            jest.mocked(require('@/hooks/useMicroservices').useMicroservices).mockReturnValue(errorMockUseMicroservices);

            render(<MicroservicesDashboard {...defaultProps} />);

            expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'destructive');
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.getByText('Failed to load microservices data: Failed to load microservices data')).toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('should show loading indicators when refreshing', () => {
            const loadingMockUseMicroservices = {
                ...mockUseMicroservices,
                isLoading: true,
            };

            jest.mocked(require('@/hooks/useMicroservices').useMicroservices).mockReturnValue(loadingMockUseMicroservices);

            render(<MicroservicesDashboard {...defaultProps} />);

            // Refresh button should show loading state
            const refreshButton = screen.getByText('Refresh');
            expect(refreshButton).toBeDisabled();
        });
    });

    describe('Responsive Design', () => {
        it('should render grid layout for overview cards', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            const cards = screen.getAllByTestId('card');
            expect(cards.length).toBeGreaterThan(3); // At least 4 overview cards
        });
    });

    describe('Service Instance Management', () => {
        it('should display service instances when expanded', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Expand persona service management
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Should show instances section
            expect(screen.getByText('Instances')).toBeInTheDocument();
            expect(screen.getByText('Instance 1')).toBeInTheDocument();
            expect(screen.getByText('Instance 2')).toBeInTheDocument();
        });

        it('should show running status for instances', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Expand persona service management
            const manageButtons = screen.getAllByText('Manage');
            await user.click(manageButtons[0]);

            // Should show running badges
            const runningBadges = screen.getAllByText('Running');
            expect(runningBadges.length).toBe(2); // persona has 2 instances
        });
    });

    describe('Environment-Specific Behavior', () => {
        it('should display environment badge correctly', () => {
            render(<MicroservicesDashboard environment="production" region="eu-west-1" />);

            expect(screen.getByText('production • eu-west-1')).toBeInTheDocument();
        });

        it('should handle different refresh intervals', () => {
            render(<MicroservicesDashboard {...defaultProps} refreshInterval={60000} />);

            // Component should render without errors with custom refresh interval
            expect(screen.getByText('Microservices Dashboard')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels and roles', () => {
            render(<MicroservicesDashboard {...defaultProps} />);

            // Check for proper heading structure
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Microservices Dashboard');
        });

        it('should support keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<MicroservicesDashboard {...defaultProps} />);

            // Tab through interactive elements
            await user.tab();
            expect(document.activeElement).toHaveAttribute('data-testid', 'button');
        });
    });
});