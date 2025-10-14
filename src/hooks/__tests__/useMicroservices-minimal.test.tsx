/**
 * Minimal useMicroservices Hook Test
 * 
 * Tests the basic functionality of the useMicroservices hook
 */

import { renderHook } from '@testing-library/react';
import { useMicroservices } from '../useMicroservices';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-ecs', () => ({
    ECSClient: jest.fn(() => ({
        send: jest.fn(),
    })),
    ListServicesCommand: jest.fn(),
    DescribeServicesCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-application-auto-scaling', () => ({
    ApplicationAutoScalingClient: jest.fn(() => ({
        send: jest.fn(),
    })),
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn(() => ({
        send: jest.fn(),
    })),
}));

describe('useMicroservices Hook - Minimal Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return default values when initialized', () => {
        const { result } = renderHook(() => useMicroservices({
            environment: 'development',
            region: 'eu-central-1'
        }));

        expect(result.current).toBeDefined();
        expect(result.current.services).toBeDefined();
        expect(result.current.isLoading).toBeDefined();
        expect(result.current.error).toBeDefined();
    });

    it('should handle different environments', () => {
        const { result } = renderHook(() => useMicroservices({
            environment: 'production',
            region: 'eu-west-1'
        }));

        expect(result.current).toBeDefined();
        expect(result.current.services).toBeDefined();
    });

    it('should provide required functions', () => {
        const { result } = renderHook(() => useMicroservices({
            environment: 'development',
            region: 'eu-central-1'
        }));

        expect(typeof result.current.scaleService).toBe('function');
        expect(typeof result.current.deployService).toBe('function');
        expect(typeof result.current.removeService).toBe('function');
        expect(typeof result.current.refreshData).toBe('function');
    });
});