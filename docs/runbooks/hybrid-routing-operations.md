# Hybrid Routing Operations Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: Production-Ready  
**Owner**: DevOps & AI Operations Team

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Operational Procedures](#operational-procedures)
4. [Incident Response](#incident-response)
5. [Troubleshooting](#troubleshooting)
6. [Maintenance](#maintenance)
7. [Escalation](#escalation)

## Overview

This runbook provides operational procedures for managing and troubleshooting the Hybrid Routing system for AI operations. The system combines direct Bedrock access with MCP integration for optimal performance and reliability.

### System Components

- **Hybrid Router**: Intelligent routing between direct Bedrock and MCP paths
- **Direct Bedrock Client**: Low-latency direct access for critical operations
- **MCP Router**: Message-based routing for standard operations
- **Support Manager**: Orchestrates support operations across both paths
- **Health Monitoring**: Real-time health checks and alerting
- **Metrics Publisher**: CloudWatch metrics for all operations
- **Log Aggregator**: Centralized logging across all components

### Key Metrics

- **Routing Efficiency**: Target >80% optimal routing decisions
- **Direct Bedrock Latency**: Emergency <5s, Critical <10s
- **MCP Latency**: Standard operations <30s
- **Health Check Success Rate**: >99%
- **Alert Response Time**: <5 minutes for critical alerts

## System Architecture

### Routing Decision Matrix

```
Operation Type    | Priority  | Latency Req | Route      | Fallback
------------------|-----------|-------------|------------|----------
Emergency         | Critical  | < 5s        | Direct     | None
Infrastructure    | Critical  | < 10s       | Direct     | MCP
Meta Monitor      | High      | < 15s       | Direct     | MCP
Implementation    | High      | < 15s       | Direct     | MCP
Kiro Communication| Medium    | < 30s       | MCP        | Direct
Standard Analysis | Medium    | < 30s       | MCP        | Direct
Background Tasks  | Low       | < 60s       | MCP        | Direct
```

### Component Dependencies

```
┌─────────────────────────────────────────────────────┐
│              Hybrid Routing System                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Intelligent │◄────────┤   Support    │         │
│  │    Router     │         │   Manager    │         │
│  └───────┬──────┘         └──────────────┘         │
│          │                                           │
│    ┌─────┴─────┐                                    │
│    │           │                                     │
│    ▼           ▼                                     │
│ ┌──────┐   ┌──────┐                                │
│ │Direct│   │ MCP  │                                │
│ │Bedrock   │Router│                                │
│ └──────┘   └──────┘                                │
│                                                      │
│  ┌──────────────────────────────────────┐          │
│  │     Health & Monitoring Layer         │          │
│  │  - Health Checker                     │          │
│  │  - Metrics Publisher                  │          │
│  │  - Log Aggregator                     │          │
│  │  - Alert Manager                      │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

## Operational Procedures

### Daily Operations

#### Morning Health Check

**Frequency**: Daily at 08:00 UTC  
**Duration**: 10 minutes  
**Owner**: On-call engineer

**Steps**:

1. Check overall system health

   ```bash
   curl https://api.matbakh.app/health/detailed
   ```

2. Review overnight metrics

   - Navigate to CloudWatch Dashboard: "Hybrid-Routing-Overview"
   - Check for any anomalies in routing efficiency
   - Verify latency metrics are within SLA

3. Review active alerts

   ```bash
   curl https://api.matbakh.app/health/alerts
   ```

4. Check component health

   - Hybrid Router: Should be "healthy"
   - Direct Bedrock Client: Should be "healthy"
   - MCP Router: Should be "healthy"
   - Support Manager: Should be "healthy"

5. Document findings in operations log

**Expected Results**:

- All components healthy
- No critical alerts
- Routing efficiency >80%
- Latency within SLA

**Escalation**: If any component is critical, follow [Critical Component Failure](#critical-component-failure) procedure
