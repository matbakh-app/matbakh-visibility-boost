/**
 * SSRF Protection Validator Tests
 *
 * Comprehensive test suite for SSRF protection validation
 */

import { AuditTrailSystem } from "../audit-trail-system";
import { SSRFProtectionValidator } from "../ssrf-protection-validator";

describe("SSRFProtectionValidator", () => {
  let validator: SSRFProtectionValidator;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Create mock audit trail
    mockAuditTrail = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    validator = new SSRFProtectionValidator({
      auditTrail: mockAuditTrail,
    });
  });

  describe("Protocol Validation", () => {
    it("should allow HTTPS URLs", async () => {
      const result = await validator.validateUrl(
        "https://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke"
      );

      expect(result.allowed).toBe(true);
      expect(result.protocol).toBe("https:");
    });

    it("should block HTTP URLs", async () => {
      const result = await validator.validateUrl(
        "http://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("protocol");
      expect(result.reason).toContain("Protocol http: is not allowed");
    });

    it("should block FTP URLs", async () => {
      const result = await validator.validateUrl("ftp://example.com/file.txt");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("protocol");
    });

    it("should block file:// URLs", async () => {
      const result = await validator.validateUrl("file:///etc/passwd");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("protocol");
    });
  });

  describe("Metadata Endpoint Protection", () => {
    it("should block AWS metadata endpoint", async () => {
      const result = await validator.validateUrl(
        "https://169.254.169.254/latest/meta-data/"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("metadata");
      expect(result.reason).toContain("Metadata endpoint");
    });

    it("should block GCP metadata endpoint", async () => {
      const result = await validator.validateUrl(
        "https://metadata.google.internal/"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("metadata");
    });

    it("should block AWS Time Sync Service", async () => {
      const result = await validator.validateUrl("https://169.254.169.253/");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("metadata");
    });
  });

  describe("Private IP Range Protection", () => {
    it("should block 10.0.0.0/8 range", async () => {
      const result = await validator.validateUrl("https://10.0.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("10.0.0.0/8");
    });

    it("should block 172.16.0.0/12 range", async () => {
      const result = await validator.validateUrl("https://172.16.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("172.16.0.0/12");
    });

    it("should block 192.168.0.0/16 range", async () => {
      const result = await validator.validateUrl("https://192.168.1.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("192.168.0.0/16");
    });

    it("should block carrier-grade NAT range 100.64.0.0/10", async () => {
      const result = await validator.validateUrl("https://100.64.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("100.64.0.0/10");
    });

    it("should block link-local range 169.254.0.0/16", async () => {
      const result = await validator.validateUrl("https://169.254.1.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("169.254.0.0/16");
    });

    it("should block multicast range 224.0.0.0/4", async () => {
      const result = await validator.validateUrl("https://224.0.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("224.0.0.0/4");
    });

    it("should block reserved range 240.0.0.0/4", async () => {
      const result = await validator.validateUrl("https://240.0.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("private_ip");
      expect(result.reason).toContain("240.0.0.0/4");
    });

    it("should block 0.0.0.0/8 range", async () => {
      const result = await validator.validateUrl("https://0.0.0.1/api");

      expect(result.allowed).toBe(false);
      // 0.0.0.0 is caught by domain whitelist since it's not a valid domain
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });
  });

  describe("Localhost Protection", () => {
    it("should block localhost hostname", async () => {
      const result = await validator.validateUrl("https://localhost/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("localhost");
    });

    it("should block 127.0.0.1", async () => {
      const result = await validator.validateUrl("https://127.0.0.1/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("localhost");
    });

    it("should block 127.0.0.0/8 range", async () => {
      const result = await validator.validateUrl("https://127.0.0.2/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("localhost");
    });

    it("should block 0.0.0.0", async () => {
      const result = await validator.validateUrl("https://0.0.0.0/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("localhost");
    });
  });

  describe("IPv6 Private Range Protection", () => {
    it("should block IPv6 localhost ::1", async () => {
      const result = await validator.validateUrl("https://[::1]/api");

      expect(result.allowed).toBe(false);
      // IPv6 addresses are caught by domain whitelist since they're not in allowed domains
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });

    it("should block IPv6 private range fc00::/7", async () => {
      const result = await validator.validateUrl("https://[fc00::1]/api");

      expect(result.allowed).toBe(false);
      // IPv6 addresses are caught by domain whitelist since they're not in allowed domains
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });

    it("should block IPv6 private range fd00::/8", async () => {
      const result = await validator.validateUrl("https://[fd00::1]/api");

      expect(result.allowed).toBe(false);
      // IPv6 addresses are caught by domain whitelist since they're not in allowed domains
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });

    it("should block IPv6 link-local fe80::/10", async () => {
      const result = await validator.validateUrl("https://[fe80::1]/api");

      expect(result.allowed).toBe(false);
      // IPv6 addresses are caught by domain whitelist since they're not in allowed domains
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });
  });

  describe("Dangerous Protocol Detection", () => {
    it("should block URLs with file:// in hostname", async () => {
      const result = await validator.validateUrl("https://file://etc/passwd");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dangerous_protocol");
    });

    it("should block URLs with gopher:// in hostname", async () => {
      const result = await validator.validateUrl(
        "https://gopher://example.com"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dangerous_protocol");
    });

    it("should block URLs with ftp:// in hostname", async () => {
      const result = await validator.validateUrl("https://ftp://example.com");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dangerous_protocol");
    });
  });

  describe("Domain Whitelist Enforcement", () => {
    it("should allow whitelisted AWS Bedrock domain", async () => {
      const result = await validator.validateUrl(
        "https://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke"
      );

      expect(result.allowed).toBe(true);
    });

    it("should allow whitelisted Google domain", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com/search"
      );

      expect(result.allowed).toBe(true);
    });

    it("should allow whitelisted subdomain", async () => {
      const result = await validator.validateUrl("https://api.google.com/data");

      expect(result.allowed).toBe(true);
    });

    it("should block non-whitelisted domain", async () => {
      const result = await validator.validateUrl("https://evil.com/api");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });

    it("should block non-whitelisted subdomain", async () => {
      const result = await validator.validateUrl(
        "https://evil.google.com.attacker.com/api"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("domain_not_allowed");
    });
  });

  describe("DNS Rebinding Protection", () => {
    it("should block xip.io domains", async () => {
      const result = await validator.validateUrl(
        "https://127.0.0.1.xip.io/api"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dns_rebinding");
    });

    it("should block nip.io domains", async () => {
      const result = await validator.validateUrl(
        "https://192.168.1.1.nip.io/api"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dns_rebinding");
    });

    it("should block sslip.io domains", async () => {
      const result = await validator.validateUrl(
        "https://10.0.0.1.sslip.io/api"
      );

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("dns_rebinding");
    });
  });

  describe("Invalid URL Handling", () => {
    it("should handle invalid URL format", async () => {
      const result = await validator.validateUrl("not-a-valid-url");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("invalid_url");
      expect(result.reason).toContain("Invalid URL format");
    });

    it("should handle empty URL", async () => {
      const result = await validator.validateUrl("");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("invalid_url");
    });

    it("should handle malformed URL", async () => {
      const result = await validator.validateUrl("https://");

      expect(result.allowed).toBe(false);
      expect(result.blockedCategory).toBe("invalid_url");
    });
  });

  describe("Audit Trail Integration", () => {
    it("should log SSRF violation to audit trail", async () => {
      await validator.validateUrl("https://169.254.169.254/latest/meta-data/");

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "ssrf_violation",
          complianceStatus: "violation",
          metadata: expect.objectContaining({
            blockedCategory: "metadata",
          }),
        })
      );
    });

    it("should log successful validation to audit trail", async () => {
      await validator.validateUrl("https://www.google.com/search");

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "ssrf_validation",
          complianceStatus: "compliant",
        })
      );
    });

    it("should include request ID in audit logs", async () => {
      const requestId = "test-request-123";
      await validator.validateUrl("https://www.google.com/search", requestId);

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId,
        })
      );
    });
  });

  describe("Configuration Management", () => {
    it("should allow updating configuration", () => {
      validator.updateConfig({
        blockMetadataEndpoints: false,
      });

      const config = validator.getConfig();
      expect(config.blockMetadataEndpoints).toBe(false);
    });

    it("should allow adding custom allowed domain", () => {
      validator.addAllowedDomain("custom-api.example.com");

      const domains = validator.getAllowedDomains();
      expect(domains).toContain("custom-api.example.com");
    });

    it("should allow removing allowed domain", () => {
      validator.removeAllowedDomain("google.com");

      const domains = validator.getAllowedDomains();
      expect(domains).not.toContain("google.com");
    });

    it("should not add duplicate domains", () => {
      const initialLength = validator.getAllowedDomains().length;

      validator.addAllowedDomain("google.com");
      validator.addAllowedDomain("google.com");

      const domains = validator.getAllowedDomains();
      expect(domains.length).toBe(initialLength);
    });
  });

  describe("Edge Cases", () => {
    it("should handle URL with port number", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com:443/search"
      );

      expect(result.allowed).toBe(true);
    });

    it("should handle URL with query parameters", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com/search?q=test"
      );

      expect(result.allowed).toBe(true);
    });

    it("should handle URL with fragment", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com/page#section"
      );

      expect(result.allowed).toBe(true);
    });

    it("should handle URL with authentication", async () => {
      const result = await validator.validateUrl(
        "https://user:pass@www.google.com/api"
      );

      expect(result.allowed).toBe(true);
    });

    it("should handle uppercase domain", async () => {
      const result = await validator.validateUrl(
        "https://WWW.GOOGLE.COM/search"
      );

      expect(result.allowed).toBe(true);
    });

    it("should handle mixed case domain", async () => {
      const result = await validator.validateUrl(
        "https://WwW.GoOgLe.CoM/search"
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe("Security Regression Tests", () => {
    it("should block URL bypass attempt with @", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com@evil.com/api"
      );

      expect(result.allowed).toBe(false);
    });

    it("should block URL with embedded IP", async () => {
      const result = await validator.validateUrl(
        "https://www.google.com.127.0.0.1/api"
      );

      expect(result.allowed).toBe(false);
    });

    it("should block URL with hex-encoded IP", async () => {
      const result = await validator.validateUrl(
        "https://0x7f.0x0.0x0.0x1/api"
      );

      expect(result.allowed).toBe(false);
    });

    it("should block URL with octal-encoded IP", async () => {
      const result = await validator.validateUrl("https://0177.0.0.1/api");

      expect(result.allowed).toBe(false);
    });
  });

  describe("Performance", () => {
    it("should validate URL quickly", async () => {
      const startTime = Date.now();

      await validator.validateUrl("https://www.google.com/search");

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should handle multiple validations efficiently", async () => {
      const urls = [
        "https://www.google.com/search",
        "https://bedrock-runtime.eu-central-1.amazonaws.com/model/invoke",
        "https://www.facebook.com/api",
        "https://www.instagram.com/api",
        "https://www.yelp.com/api",
      ];

      const startTime = Date.now();

      await Promise.all(urls.map((url) => validator.validateUrl(url)));

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should complete all in < 500ms
    });
  });
});
