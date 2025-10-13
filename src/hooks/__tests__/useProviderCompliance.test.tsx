/**
 * Provider Compliance Hook Tests
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useProviderCompliance } from '../useProviderCompliance';

describe('useProviderCompliance', () => {
  it('should initialize with mock data', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
      expect(result.current.violations).toHaveLength(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    // Check that all providers are initialized
    expect(result.current.agreements.map(a => a.providerId)).toEqual(
      expect.arrayContaining(['bedrock', 'google', 'meta'])
    );
  });

  it('should verify provider compliance', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    let complianceResult;
    await act(async () => {
      complianceResult = await result.current.verifyProviderCompliance('bedrock');
    });

    expect(complianceResult).toEqual({
      allowed: true,
      provider: 'bedrock',
      violations: [],
      warnings: [],
      complianceScore: 100,
      agreementStatus: 'active',
      lastVerified: expect.any(String)
    });
  });

  it('should detect non-existent provider', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    let complianceResult;
    await act(async () => {
      complianceResult = await result.current.verifyProviderCompliance('unknown');
    });

    expect(complianceResult).toEqual({
      allowed: false,
      provider: 'unknown',
      violations: ['No agreement found for provider: unknown'],
      warnings: [],
      complianceScore: 0,
      agreementStatus: 'missing',
      lastVerified: 'never'
    });
  });

  it('should record and resolve violations', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    let violationId;
    await act(async () => {
      violationId = await result.current.recordViolation({
        providerId: 'google',
        violationType: 'training_detected',
        severity: 'high',
        description: 'Test violation'
      });
    });

    expect(violationId).toBeDefined();
    expect(result.current.violations).toHaveLength(1);
    expect(result.current.violations[0].status).toBe('open');

    await act(async () => {
      await result.current.resolveViolation(violationId!, 'Test resolution');
    });

    expect(result.current.violations[0].status).toBe('resolved');
  });

  it('should update agreement verification', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    const initialAgreement = result.current.getAgreement('bedrock');
    const initialVerificationDate = initialAgreement?.lastVerified;

    await act(async () => {
      await result.current.updateAgreementVerification(
        'bedrock',
        'verified',
        'Test evidence'
      );
    });

    const updatedAgreement = result.current.getAgreement('bedrock');
    expect(updatedAgreement?.verificationStatus).toBe('verified');
    expect(updatedAgreement?.lastVerified).not.toBe(initialVerificationDate);
  });

  it('should generate compliance report', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    let report;
    await act(async () => {
      report = await result.current.generateComplianceReport(startDate, endDate);
    });

    expect(report).toEqual({
      reportId: expect.any(String),
      generatedAt: expect.any(String),
      overallCompliance: 'compliant',
      complianceScore: 100,
      providers: expect.arrayContaining([
        expect.objectContaining({
          providerId: 'bedrock',
          compliant: true,
          agreementStatus: 'active'
        }),
        expect.objectContaining({
          providerId: 'google',
          compliant: true,
          agreementStatus: 'active'
        }),
        expect.objectContaining({
          providerId: 'meta',
          compliant: true,
          agreementStatus: 'active'
        })
      ]),
      violations: expect.objectContaining({
        total: expect.any(Number),
        byType: expect.any(Object),
        bySeverity: expect.any(Object),
        resolved: expect.any(Number),
        pending: expect.any(Number)
      }),
      recommendations: expect.any(Array),
      nextActions: expect.any(Array)
    });
  });

  it('should load compliance data', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    await act(async () => {
      await result.current.loadComplianceData();
    });

    expect(result.current.report).toBeDefined();
    expect(result.current.report?.reportId).toBeDefined();
    expect(result.current.report?.overallCompliance).toBe('compliant');
  });

  it('should identify compliant providers', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    expect(result.current.isProviderCompliant('bedrock')).toBe(true);
    expect(result.current.isProviderCompliant('google')).toBe(true);
    expect(result.current.isProviderCompliant('meta')).toBe(true);
    expect(result.current.isProviderCompliant('unknown')).toBe(false);
  });

  it('should get expiring agreements', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    // With default expiry dates in 2025, no agreements should be expiring soon
    const expiringAgreements = result.current.getExpiringAgreements(30);
    expect(expiringAgreements).toHaveLength(0);

    // Test with a larger threshold (2000 days = ~5.5 years)
    const expiringAgreementsLargeThreshold = result.current.getExpiringAgreements(2000);
    expect(expiringAgreementsLargeThreshold.length).toBeGreaterThan(0);
  });

  it('should get open violations', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    // Initially no violations
    expect(result.current.getOpenViolations()).toHaveLength(0);

    // Add a violation
    await act(async () => {
      await result.current.recordViolation({
        providerId: 'meta',
        violationType: 'data_retention',
        severity: 'medium',
        description: 'Test open violation'
      });
    });

    expect(result.current.getOpenViolations()).toHaveLength(1);
  });

  it('should get specific agreement', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    const bedrockAgreement = result.current.getAgreement('bedrock');
    expect(bedrockAgreement).toBeDefined();
    expect(bedrockAgreement?.providerId).toBe('bedrock');
    expect(bedrockAgreement?.providerName).toBe('Amazon Web Services (Bedrock)');

    const unknownAgreement = result.current.getAgreement('unknown');
    expect(unknownAgreement).toBeUndefined();
  });

  it('should handle provider-specific compliance requirements', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    // Check Bedrock compliance
    const bedrockAgreement = result.current.getAgreement('bedrock');
    expect(bedrockAgreement?.noTrainingOnCustomerData).toBe(true);
    expect(bedrockAgreement?.gdprCompliant).toBe(true);
    expect(bedrockAgreement?.euDataResidency).toBe(true);

    // Check Google compliance
    const googleAgreement = result.current.getAgreement('google');
    expect(googleAgreement?.noTrainingOnCustomerData).toBe(true);
    expect(googleAgreement?.gdprCompliant).toBe(true);
    expect(googleAgreement?.euDataResidency).toBe(true);

    // Check Meta compliance (note: EU data residency is false)
    const metaAgreement = result.current.getAgreement('meta');
    expect(metaAgreement?.noTrainingOnCustomerData).toBe(true);
    expect(metaAgreement?.gdprCompliant).toBe(true);
    expect(metaAgreement?.euDataResidency).toBe(false);
  });

  it('should meet DoD criteria for provider agreement compliance', async () => {
    const { result } = renderHook(() => useProviderCompliance());

    await waitFor(() => {
      expect(result.current.agreements).toHaveLength(3);
    });

    // DoD: All providers have no-training agreements
    const allAgreements = result.current.agreements;
    expect(allAgreements.every(a => a.noTrainingOnCustomerData)).toBe(true);
    expect(allAgreements.every(a => a.dataProcessingAgreement)).toBe(true);
    expect(allAgreements.every(a => a.gdprCompliant)).toBe(true);

    // DoD: Violation tracking functionality
    await act(async () => {
      await result.current.recordViolation({
        providerId: 'bedrock',
        violationType: 'training_detected',
        severity: 'critical',
        description: 'Test DoD violation'
      });
    });

    expect(result.current.violations).toHaveLength(1);
    expect(result.current.getOpenViolations()).toHaveLength(1);

    // DoD: Compliance verification functionality
    let complianceResult;
    await act(async () => {
      complianceResult = await result.current.verifyProviderCompliance('bedrock');
    });

    expect(complianceResult).toEqual(
      expect.objectContaining({
        allowed: expect.any(Boolean),
        provider: 'bedrock',
        violations: expect.any(Array),
        warnings: expect.any(Array),
        complianceScore: expect.any(Number),
        agreementStatus: expect.any(String),
        lastVerified: expect.any(String)
      })
    );

    // DoD: Compliance reporting functionality
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    let report;
    await act(async () => {
      report = await result.current.generateComplianceReport(startDate, endDate);
    });

    expect(report).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        overallCompliance: expect.stringMatching(/compliant|non_compliant|warning/),
        complianceScore: expect.any(Number),
        providers: expect.any(Array),
        violations: expect.objectContaining({
          total: expect.any(Number),
          byType: expect.any(Object),
          bySeverity: expect.any(Object),
          resolved: expect.any(Number),
          pending: expect.any(Number)
        }),
        recommendations: expect.any(Array),
        nextActions: expect.any(Array)
      })
    );
  });
});