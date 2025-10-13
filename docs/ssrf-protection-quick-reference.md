# SSRF Protection - Quick Reference Guide

## Overview

The SSRF Protection Validator provides comprehensive Server-Side Request Forgery (SSRF) protection for the Direct Bedrock Client, ensuring all external requests are validated against security policies.

## Quick Start

### Basic Usage

```typescript
import { DirectBedrockClient } from "./direct-bedrock-client";

const client = new DirectBedrockClient();

// Validate URL before making request
const validation = await client.validateUrlForSSRF(
  "https://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke",
  "operation-123"
);

if (!validation.allowed) {
  console.error("SSRF violation:", validation.reason);
  console.error("Blocked category:", validation.blockedCategory);
  return;
}

// Proceed with request
const response = await client.executeSupportOperation({
  operation: "infrastructure",
  priority: "critical",
  prompt: "Analyze system health",
});
```

### Configuration

```typescript
// Update SSRF protection configuration
client.updateSSRFProtectionConfig({
  allowedDomains: ["custom-api.example.com"],
  blockMetadataEndpoints: true,
  blockPrivateIPs: true,
  blockLocalhost: true,
  blockIPv6Private: true,
  blockDangerousProtocols: true,
  enableDNSRebindingProtection: true,
});

// Add custom allowed domain
client.addAllowedDomain("custom-api.example.com");

// Remove allowed domain
client.removeAllowedDomain("old-api.example.com");

// Get all allowed domains
const domains = client.getAllowedDomains();
```

## Protection Layers

### 1. Protocol Validation

**Allowed**: HTTPS only  
**Blocked**: HTTP, FTP, file://, gopher://, dict://, ldap://, tftp://

```typescript
// ✅ Allowed
await client.validateUrlForSSRF("https://api.example.com/data");

// ❌ Blocked
await client.validateUrlForSSRF("http://api.example.com/data");
await client.validateUrlForSSRF("ftp://files.example.com/data");
await client.validateUrlForSSRF("file:///etc/passwd");
```

### 2. Metadata Endpoint Protection

**Blocked Endpoints**:

- 169.254.169.254 (AWS/Azure/GCP metadata)
- metadata.google.internal (GCP metadata)
- 169.254.169.253 (AWS Time Sync Service)

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://169.254.169.254/latest/meta-data/");
await client.validateUrlForSSRF("https://metadata.google.internal/");
```

### 3. Private IP Range Protection

**Blocked Ranges**:

- 10.0.0.0/8 (RFC1918)
- 172.16.0.0/12 (RFC1918)
- 192.168.0.0/16 (RFC1918)
- 100.64.0.0/10 (Carrier-grade NAT)
- 169.254.0.0/16 (Link-local)
- 224.0.0.0/4 (Multicast)
- 240.0.0.0/4 (Reserved)

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://10.0.0.1/api");
await client.validateUrlForSSRF("https://172.16.0.1/api");
await client.validateUrlForSSRF("https://192.168.1.1/api");
```

### 4. Localhost Protection

**Blocked**:

- localhost
- 127.0.0.0/8
- 0.0.0.0
- ::1 (IPv6)

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://localhost/api");
await client.validateUrlForSSRF("https://127.0.0.1/api");
await client.validateUrlForSSRF("https://0.0.0.0/api");
```

### 5. IPv6 Private Range Protection

**Blocked Ranges**:

- fc00::/7 (Unique local addresses)
- fd00::/8 (Unique local addresses)
- fe80::/10 (Link-local)
- ::1 (Localhost)

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://[::1]/api");
await client.validateUrlForSSRF("https://[fc00::1]/api");
await client.validateUrlForSSRF("https://[fe80::1]/api");
```

### 6. Dangerous Protocol Detection

**Blocked**: Embedded dangerous protocols in hostnames

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://file://etc/passwd");
await client.validateUrlForSSRF("https://gopher://example.com");
```

### 7. Domain Whitelist Enforcement

**Default Allowed Domains**:

- AWS Bedrock endpoints (bedrock-runtime.\*.amazonaws.com)
- Google APIs (google.com, googleapis.com)
- Social Media APIs (facebook.com, instagram.com)
- Review Platforms (tripadvisor.com, yelp.com)

```typescript
// ✅ Allowed
await client.validateUrlForSSRF(
  "https://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke"
);
await client.validateUrlForSSRF("https://www.google.com/search");

// ❌ Blocked
await client.validateUrlForSSRF("https://evil.com/api");
```

### 8. DNS Rebinding Protection

**Blocked Domains**:

- \*.xip.io
- \*.nip.io
- \*.sslip.io

```typescript
// ❌ Blocked
await client.validateUrlForSSRF("https://127.0.0.1.xip.io/api");
await client.validateUrlForSSRF("https://192.168.1.1.nip.io/api");
```

## Validation Result

```typescript
interface SSRFValidationResult {
  allowed: boolean;
  reason?: string;
  blockedCategory?:
    | "protocol"
    | "metadata"
    | "private_ip"
    | "localhost"
    | "ipv6_private"
    | "dangerous_protocol"
    | "domain_not_allowed"
    | "invalid_url"
    | "dns_rebinding";
  url: string;
  hostname: string;
  protocol: string;
  timestamp: Date;
}
```

## Error Handling

```typescript
try {
  const validation = await client.validateUrlForSSRF(url, operationId);

  if (!validation.allowed) {
    // Handle SSRF violation
    console.error("SSRF violation detected:", {
      url: validation.url,
      reason: validation.reason,
      category: validation.blockedCategory,
    });

    // Log to monitoring system
    await logSecurityEvent("ssrf_violation", validation);

    // Return error to caller
    throw new Error(`SSRF protection blocked request: ${validation.reason}`);
  }

  // Proceed with request
  return await makeRequest(url);
} catch (error) {
  console.error("SSRF validation error:", error);
  throw error;
}
```

## Monitoring and Alerting

### Audit Trail Integration

All SSRF validations and violations are logged to the audit trail:

```typescript
// Successful validation
{
  eventType: 'ssrf_validation',
  requestId: 'operation-123',
  provider: 'bedrock',
  complianceStatus: 'compliant',
  metadata: {
    url: 'https://www.google.com/search',
    hostname: 'www.google.com',
    protocol: 'https:',
    timestamp: '2025-01-14T10:30:00Z',
  }
}

// SSRF violation
{
  eventType: 'ssrf_violation',
  requestId: 'operation-123',
  provider: 'bedrock',
  complianceStatus: 'violation',
  metadata: {
    url: 'https://169.254.169.254/latest/meta-data/',
    hostname: '169.254.169.254',
    protocol: 'https:',
    blockedCategory: 'metadata',
    reason: 'Metadata endpoint 169.254.169.254 is blocked for security reasons',
    timestamp: '2025-01-14T10:30:00Z',
  }
}
```

### Monitoring Metrics

- **SSRF Violations**: Count of blocked requests by category
- **Validation Latency**: Time taken for SSRF validation
- **Allowed Requests**: Count of successful validations
- **Error Rate**: Validation errors and failures

### Alerting Rules

```typescript
// Alert on SSRF violations
if (ssrfViolations > 10 per minute) {
  alert('High SSRF violation rate detected');
}

// Alert on validation errors
if (validationErrors > 5 per minute) {
  alert('SSRF validation errors detected');
}

// Alert on suspicious patterns
if (metadataEndpointAttempts > 3 per hour) {
  alert('Potential SSRF attack detected');
}
```

## Performance

- **Single Validation**: < 100ms
- **Multiple Validations**: < 500ms for 5 URLs
- **Memory Footprint**: Minimal (stateless design)
- **CPU Utilization**: Efficient regex processing

## Security Best Practices

### 1. Always Validate Before Requests

```typescript
// ✅ Good
const validation = await client.validateUrlForSSRF(url);
if (validation.allowed) {
  await makeRequest(url);
}

// ❌ Bad
await makeRequest(url); // No validation
```

### 2. Log All Violations

```typescript
if (!validation.allowed) {
  await auditTrail.logEvent({
    eventType: "ssrf_violation",
    metadata: validation,
  });
}
```

### 3. Use Request IDs

```typescript
const operationId = generateOperationId();
const validation = await client.validateUrlForSSRF(url, operationId);
```

### 4. Monitor Validation Failures

```typescript
if (!validation.allowed) {
  metrics.increment("ssrf.violations", {
    category: validation.blockedCategory,
  });
}
```

### 5. Keep Whitelist Updated

```typescript
// Regularly review and update allowed domains
const domains = client.getAllowedDomains();
console.log("Current allowed domains:", domains);

// Add new domains as needed
client.addAllowedDomain("new-api.example.com");

// Remove deprecated domains
client.removeAllowedDomain("old-api.example.com");
```

## Troubleshooting

### Issue: Legitimate URL Blocked

**Solution**: Add domain to whitelist

```typescript
client.addAllowedDomain("legitimate-api.example.com");
```

### Issue: Validation Too Slow

**Solution**: Check for DNS resolution issues or network latency

```typescript
// Disable DNS rebinding protection if not needed
client.updateSSRFProtectionConfig({
  enableDNSRebindingProtection: false,
});
```

### Issue: False Positives

**Solution**: Review validation logs and adjust configuration

```typescript
// Get validation details
const validation = await client.validateUrlForSSRF(url);
console.log("Validation result:", validation);

// Adjust configuration as needed
client.updateSSRFProtectionConfig({
  blockPrivateIPs: false, // If private IPs are legitimate
});
```

## Related Documentation

- [Bedrock Activation Task 5.2 Completion Report](./bedrock-activation-task-5.2-ssrf-protection-completion-report.md)
- [AI Provider Architecture](./ai-provider-architecture.md)
- [Security and Privacy](./security-and-privacy.md)
- [Audit Trail System](./ai-operations-audit-trail-system.md)

## Support

For issues or questions:

- Check audit trail logs for validation details
- Review monitoring metrics for patterns
- Contact security team for policy updates
- Refer to completion report for implementation details
