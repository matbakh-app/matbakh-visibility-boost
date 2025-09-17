/**
 * Agent Handoff System - Manages agent-to-agent transitions with audit trails
 * Provides context preservation, SLA tracking, and collaboration logging
 */

import { v4 as uuidv4 } from 'uuid';

export interface HandoffContext {
  persona?: string;
  journeyStage?: string;
  kpis?: Record<string, number>;
  lastActions: Array<{
    ts: number;
    action: string;
    agent?: string;
  }>;
  businessContext?: Record<string, any>;
}

export interface HandoffTicket {
  id: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  context: HandoffContext;
  payload: Record<string, any>;
  expectedOutcome: string;
  slaMs: number;
  confidence: number;
  annotations: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'completed' | 'failed' | 'timeout';
}

/**
 * Create a handoff ticket for agent-to-agent transitions
 */
export function createHandoff(params: {
  fromAgent: string;
  toAgent: string;
  reason: string;
  context?: HandoffContext;
  payload: Record<string, any>;
  expectedOutcome: string;
  slaMs: number;
  confidence: number;
  annotations?: Record<string, any>;
}): HandoffTicket {
  return {
    id: uuidv4(),
    fromAgent: params.fromAgent,
    toAgent: params.toAgent,
    reason: params.reason,
    context: params.context || { lastActions: [] },
    payload: params.payload,
    expectedOutcome: params.expectedOutcome,
    slaMs: params.slaMs,
    confidence: params.confidence,
    annotations: params.annotations || {},
    createdAt: new Date(),
    status: 'pending'
  };
}

/**
 * Convert handoff ticket to JSON for logging
 */
export function handoffToJSON(ticket: HandoffTicket): string {
  const logData = {
    id: ticket.id,
    transition: `${ticket.fromAgent} -> ${ticket.toAgent}`,
    reason: ticket.reason,
    expectedOutcome: ticket.expectedOutcome,
    slaMs: ticket.slaMs,
    confidence: ticket.confidence,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    context: ticket.context,
    annotations: ticket.annotations,
    payloadKeys: Object.keys(ticket.payload)
  };

  return JSON.stringify(logData, null, 2);
}