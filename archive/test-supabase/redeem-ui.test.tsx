/**
 * UI Component Tests for Redeem Code Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { RedeemCodeForm } from '@/components/redeem/RedeemCodeForm';
import { RedeemCodeInput } from '@/components/redeem/RedeemCodeInput';
import { CampaignReport } from '@/components/redeem/CampaignReport';

// Mock Supabase client
const mockSupabase = {
  functions: {
    invoke: jest.fn()
  }
};

jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('RedeemCodeForm', () => {
  const mockOnCodeGenerated = jest.fn();
  const mockPartnerId = 'test-partner-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<RedeemCodeForm partnerId={mockPartnerId} onCodeGenerated={mockOnCodeGenerated} />);

    expect(screen.getByLabelText(/beschreibung/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kampagnen-tag/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/laufzeit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/einheit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximale nutzungen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /code generieren/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RedeemCodeForm partnerId={mockPartnerId} onCodeGenerated={mockOnCodeGenerated} />);

    const submitButton = screen.getByRole('button', { name: /code generieren/i });
    fireEvent.click(submitButton);

    // Form should not submit with empty required fields
    await waitFor(() => {
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });
  });

  it('submits form with correct data', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true, code: 'ABC12345' },
      error: null
    });

    render(<RedeemCodeForm partnerId={mockPartnerId} onCodeGenerated={mockOnCodeGenerated} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/beschreibung/i), {
      target: { value: 'Test Campaign' }
    });
    fireEvent.change(screen.getByLabelText(/kampagnen-tag/i), {
      target: { value: 'TEST2024' }
    });
    fireEvent.change(screen.getByLabelText(/laufzeit/i), {
      target: { value: '7' }
    });
    fireEvent.change(screen.getByLabelText(/maximale nutzungen/i), {
      target: { value: '10' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /code generieren/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('generate-redeem-code', {
        body: {
          partnerId: mockPartnerId,
          description: 'Test Campaign',
          campaignTag: 'TEST2024',
          durationValue: 7,
          durationUnit: 'days',
          maxUses: 10
        }
      });
    });

    expect(mockOnCodeGenerated).toHaveBeenCalledWith('ABC12345');
  });

  it('displays loading state during submission', async () => {
    mockSupabase.functions.invoke.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true }, error: null }), 100))
    );

    render(<RedeemCodeForm partnerId={mockPartnerId} onCodeGenerated={mockOnCodeGenerated} />);

    const submitButton = screen.getByRole('button', { name: /code generieren/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/wird generiert/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

describe('RedeemCodeInput', () => {
  const mockLeadId = 'test-lead-123';
  const mockOnCodeRedeemed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and submit button', () => {
    render(<RedeemCodeInput leadId={mockLeadId} onCodeRedeemed={mockOnCodeRedeemed} />);

    expect(screen.getByLabelText(/redeem-code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /code einlösen/i })).toBeInTheDocument();
  });

  it('converts input to uppercase', () => {
    render(<RedeemCodeInput leadId={mockLeadId} onCodeRedeemed={mockOnCodeRedeemed} />);

    const input = screen.getByLabelText(/redeem-code/i);
    fireEvent.change(input, { target: { value: 'abc123' } });

    expect(input).toHaveValue('ABC123');
  });

  it('limits input to 8 characters', () => {
    render(<RedeemCodeInput leadId={mockLeadId} onCodeRedeemed={mockOnCodeRedeemed} />);

    const input = screen.getByLabelText(/redeem-code/i);
    fireEvent.change(input, { target: { value: 'ABCDEFGHIJ' } });

    expect(input).toHaveValue('ABCDEFGH');
  });

  it('submits code redemption', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true, campaignTag: 'TEST' },
      error: null
    });

    render(<RedeemCodeInput leadId={mockLeadId} onCodeRedeemed={mockOnCodeRedeemed} />);

    const input = screen.getByLabelText(/redeem-code/i);
    fireEvent.change(input, { target: { value: 'ABC12345' } });

    const submitButton = screen.getByRole('button', { name: /code einlösen/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('redeem-code', {
        body: {
          code: 'ABC12345',
          leadId: mockLeadId
        }
      });
    });

    expect(mockOnCodeRedeemed).toHaveBeenCalled();
  });

  it('disables submit when input is empty', () => {
    render(<RedeemCodeInput leadId={mockLeadId} onCodeRedeemed={mockOnCodeRedeemed} />);

    const submitButton = screen.getByRole('button', { name: /code einlösen/i });
    expect(submitButton).toBeDisabled();
  });
});

describe('CampaignReport', () => {
  const mockPartnerId = 'test-partner-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CampaignReport partnerId={mockPartnerId} />);

    expect(screen.getByText(/lädt/i)).toBeInTheDocument();
  });

  it('renders empty state when no codes exist', async () => {
    // Mock empty response
    render(<CampaignReport partnerId={mockPartnerId} />);

    await waitFor(() => {
      expect(screen.getByText(/keine codes vorhanden/i)).toBeInTheDocument();
    });
  });

  // Note: Full CampaignReport tests would require proper React Query setup
  // This is a simplified version focusing on component structure
});