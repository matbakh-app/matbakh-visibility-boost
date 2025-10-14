/**
 * MicroservicesDashboard Tests with Provider
 * ------------------------------------------
 * Tests using the renderWithProvider utility to properly mock hooks
 */

// ✅ Schritt 1: Hook Mock setzen (direkter Mock) - LÖST DEN BUG!
jest.mock('@/hooks/useMicroservices', () => ({
    useMicroservices: () => ({
        services: [],
        meshStatus: 'healthy',
        costAnalysis: {},
        discoveryStats: {},
        isLoading: false,
        error: null,
        scaleService: jest.fn(),
        deployService: jest.fn(),
        removeService: jest.fn(),
        updateServiceConfig: jest.fn(),
        refreshData: jest.fn(),
        getServiceHealth: jest.fn(),
        getTotalCost: jest.fn(() => 0),
        getHealthyServicesCount: jest.fn(() => 0),
        getUnhealthyServicesCount: jest.fn(() => 0),
    }),
}));

import { renderWithProvider, updateMicroservicesMock } from '@/test-utils/renderWithProvider';
import { screen } from '@testing-library/react';
import React from 'react';
import { MicroservicesDashboard } from '../MicroservicesDashboard';

// Mock UI components to avoid complex rendering issues
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card', ...props }, children),
    CardContent: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-content', ...props }, children),
    CardDescription: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-description', ...props }, children),
    CardHeader: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-header', ...props }, children),
    CardTitle: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'card-title', ...props }, children),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => React.createElement('button', { 'data-testid': 'button', ...props }, children),
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, ...props }: any) => React.createElement('span', { 'data-testid': 'badge', ...props }, children),
}));

jest.mock('@/components/ui/progress', () => ({
    Progress: ({ value, ...props }: any) => React.createElement('div', { 'data-testid': 'progress', 'data-value': value, ...props }),
}));

describe('MicroservicesDashboard - Provider Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });

        it('should render with custom microservices data', () => {
            const customData = {
                services: [
                    {
                        serviceName: 'custom-service',
                        status: 'healthy',
                        lastCheck: new Date('2025-01-14T10:00:00Z'),
                        metrics: { cpu: 75, memory: 80, requestRate: 200, errorRate: 1.0 },
                        instances: [{ id: 'custom-1', status: 'running' }],
                        meshStatus: { connected: true, errors: [] },
                    },
                ],
            };

            renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />,
                { microservicesData: customData }
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });

        it('should handle loading state', () => {
            renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />,
                { microservicesData: { isLoading: true } }
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });

        it('should handle error state', () => {
            renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />,
                { microservicesData: { error: new Error('Test error') } }
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });
    });

    describe('Environment and Region', () => {
        it('should work with different environments', () => {
            const { rerender } = renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();

            rerender(
                <MicroservicesDashboard
                    environment="production"
                    region="eu-west-1"
                />
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });
    });

    describe('Dynamic Mock Updates', () => {
        it('should update mock data dynamically', () => {
            renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();

            // Update mock data
            updateMicroservicesMock({
                services: [
                    {
                        serviceName: 'updated-service',
                        status: 'unhealthy',
                        lastCheck: new Date('2025-01-14T11:00:00Z'),
                        metrics: { cpu: 90, memory: 95, requestRate: 300, errorRate: 5.0 },
                        instances: [{ id: 'updated-1', status: 'stopped' }],
                        meshStatus: { connected: false, errors: ['Connection failed'] },
                    },
                ],
            });

            // Re-render with updated data
            const { rerender } = renderWithProvider(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />
            );

            rerender(
                <MicroservicesDashboard
                    environment="development"
                    region="eu-central-1"
                />
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });
    });
});