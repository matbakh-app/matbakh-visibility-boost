# Data Classification Framework

## 🎯 Purpose

This document defines the data classification framework for the matbakh.app platform, ensuring appropriate security controls and handling procedures are applied based on data sensitivity levels.

## 📊 Classification Levels

### 🟢 Public Data

**Definition:** Information that can be freely shared without risk to the organization or individuals.

**Examples:**

- Marketing materials and public website content
- Published API documentation
- Public blog posts and press releases
- General product information

**Security Controls:**

- Standard web security measures
- Basic access logging
- No special encryption requirements

**Retention:** Indefinite (as needed for business purposes)

---

### 🟡 Internal Data

**Definition:** Information intended for internal use that could cause minor harm if disclosed.

**Examples:**

- Internal documentation and procedures
- Employee directories (non-sensitive)
- General business metrics
- Internal training materials

**Security Controls:**

- Authentication required for access
- Role-based access control (RBAC)
- Standard encryption in transit (TLS 1.3)
- Access logging and monitoring

**Retention:** 3-7 years depending on business need

---

### 🟠 Confidential Data

**Definition:** Sensitive information that could cause significant harm to the organization or individuals if disclosed.

**Examples:**

- Customer business data and analytics
- Restaurant performance metrics
- Visibility check results
- User behavior analytics
- Internal business strategies

**Security Controls:**

- Multi-factor authentication (MFA) required
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Detailed audit logging
- Data loss prevention (DLP) monitoring
- Need-to-know access principle

**Retention:** 7 years for compliance, then secure deletion

---

### 🔴 Restricted Data

**Definition:** Highly sensitive information that could cause severe harm if disclosed and is subject to regulatory requirements.

**Examples:**

- Personal Identifiable Information (PII)
- Payment card information (PCI data)
- Authentication credentials
- Encryption keys and certificates
- Legal documents and contracts
- AI model training data (if any)

**Security Controls:**

- Strong multi-factor authentication
- Encryption at rest with customer-managed keys (KMS)
- End-to-end encryption
- Comprehensive audit trails with integrity protection
- Data masking and anonymization
- Strict access controls with approval workflows
- Regular access reviews

**Retention:** Minimum required by law, maximum 7 years, then cryptographic deletion

---

## 🤖 AI Provider Data Classification

### Data Sent to AI Providers

All data sent to AI providers (AWS Bedrock, Google AI, Meta AI) is automatically classified and handled according to strict guidelines:

#### Classification Rules for AI Processing:

1. **PII Detection:** Automatic detection and classification of personal data
2. **Business Sensitivity:** Restaurant-specific data classified as Confidential
3. **Anonymization:** Restricted data must be anonymized before AI processing
4. **No Training Guarantee:** All data sent to AI providers marked as "no training"

#### AI Provider Data Handling:

```typescript
// Data classification before AI processing
interface AIDataClassification {
  originalClassification: "public" | "internal" | "confidential" | "restricted";
  processedClassification: "public" | "internal" | "confidential"; // Never restricted
  piiDetected: boolean;
  anonymizationApplied: boolean;
  noTrainingFlag: boolean; // Always true
  retentionPolicy: "inference_only" | "no_storage";
}
```

### Provider-Specific Classifications:

#### AWS Bedrock

- **Data Classification:** Confidential (maximum allowed)
- **Processing Type:** Inference only, no training
- **Retention:** No data retention by AWS
- **Compliance:** GDPR Article 28 (Data Processing Agreement)

#### Google AI Platform

- **Data Classification:** Confidential (maximum allowed)
- **Processing Type:** Inference only, no model improvement
- **Retention:** No data retention by Google
- **Compliance:** Google Cloud DPA, GDPR compliant

#### Meta AI

- **Data Classification:** Internal (limited use)
- **Processing Type:** API inference only
- **Retention:** No data retention by Meta
- **Compliance:** Meta Developer Terms, limited to inference

---

## 🔒 Data Handling Procedures

### Classification Process

1. **Automatic Classification:** System automatically classifies data based on content analysis
2. **Manual Review:** Human review for edge cases and sensitive content
3. **Labeling:** All data tagged with appropriate classification level
4. **Access Control:** Automatic application of security controls based on classification

### Data Lifecycle Management

#### Creation

- Data classified at creation time
- Appropriate security controls applied immediately
- Classification metadata stored with data

#### Processing

- Classification verified before any processing
- AI processing limited by classification level
- Audit trail maintained for all processing activities

#### Storage

- Encryption level determined by classification
- Access controls enforced based on classification
- Retention policies applied automatically

#### Transmission

- Encryption requirements based on classification
- Approved channels only for restricted data
- Audit logging for all data transmission

#### Disposal

- Secure deletion procedures based on classification
- Cryptographic deletion for restricted data
- Compliance with retention requirements

---

## 📋 Classification Guidelines

### Restaurant Business Data

| Data Type                    | Classification | Rationale                                  |
| ---------------------------- | -------------- | ------------------------------------------ |
| Restaurant name, address     | Internal       | Business information, not highly sensitive |
| Visibility scores, analytics | Confidential   | Competitive business intelligence          |
| Customer reviews analysis    | Confidential   | Derived business insights                  |
| Owner contact information    | Restricted     | Personal identifiable information          |
| Financial performance data   | Restricted     | Highly sensitive business data             |

### User Data

| Data Type                    | Classification | Rationale                         |
| ---------------------------- | -------------- | --------------------------------- |
| User preferences             | Internal       | General application data          |
| Usage analytics (anonymized) | Confidential   | Business intelligence data        |
| Email addresses              | Restricted     | Personal identifiable information |
| Authentication data          | Restricted     | Security-critical information     |

### System Data

| Data Type                    | Classification | Rationale                         |
| ---------------------------- | -------------- | --------------------------------- |
| Application logs (sanitized) | Internal       | Operational data without PII      |
| Performance metrics          | Confidential   | Business operational intelligence |
| Security logs                | Restricted     | Security-sensitive information    |
| Encryption keys              | Restricted     | Critical security infrastructure  |

---

## 🛡️ Security Controls by Classification

### Access Controls

| Classification | Authentication | Authorization     | Monitoring          |
| -------------- | -------------- | ----------------- | ------------------- |
| Public         | None required  | Public access     | Basic logging       |
| Internal       | Single factor  | Role-based        | Standard logging    |
| Confidential   | Multi-factor   | Need-to-know      | Enhanced logging    |
| Restricted     | Strong MFA     | Approval required | Comprehensive audit |

### Encryption Requirements

| Classification | At Rest  | In Transit | Key Management            |
| -------------- | -------- | ---------- | ------------------------- |
| Public         | Optional | TLS 1.2+   | Standard keys             |
| Internal       | AES-256  | TLS 1.3    | AWS managed keys          |
| Confidential   | AES-256  | TLS 1.3    | Customer managed keys     |
| Restricted     | AES-256  | End-to-end | Hardware security modules |

### Retention Policies

| Classification | Retention Period | Deletion Method                       |
| -------------- | ---------------- | ------------------------------------- |
| Public         | Business need    | Standard deletion                     |
| Internal       | 3-7 years        | Secure deletion                       |
| Confidential   | 7 years          | Cryptographic deletion                |
| Restricted     | Legal minimum    | Cryptographic deletion + verification |

---

## 🔍 Compliance & Monitoring

### Data Classification Compliance

- **GDPR Article 32:** Technical and organizational measures
- **GDPR Article 25:** Data protection by design and by default
- **ISO 27001:** Information security management
- **SOC 2 Type II:** Security and availability controls

### Monitoring & Reporting

- **Classification Accuracy:** Regular audits of data classification
- **Access Violations:** Monitoring for inappropriate access attempts
- **Data Movement:** Tracking data movement between classification levels
- **Compliance Reports:** Regular reports on classification compliance

### Incident Response

- **Misclassification:** Procedures for correcting data classification errors
- **Unauthorized Access:** Response procedures for classification violations
- **Data Breaches:** Classification-specific breach response procedures
- **Regulatory Reporting:** Classification-based regulatory notification requirements

---

## 📚 Training & Awareness

### Staff Training

- **Classification Guidelines:** Training on proper data classification
- **Handling Procedures:** Procedures for each classification level
- **Incident Reporting:** How to report classification issues
- **Regular Updates:** Ongoing training on classification changes

### Developer Guidelines

- **Secure Coding:** Classification-aware development practices
- **API Design:** Classification metadata in API responses
- **Testing:** Classification-safe test data procedures
- **Deployment:** Classification verification in CI/CD pipelines

---

## 📞 Contact Information

### Data Classification Team

- **Data Protection Officer:** dpo@matbakh.app
- **Classification Questions:** data-classification@matbakh.app
- **Incident Reporting:** security@matbakh.app

### Escalation Procedures

1. **Immediate:** Contact security team for urgent classification issues
2. **Business Hours:** Contact data classification team for guidance
3. **After Hours:** Use incident response procedures for critical issues

---

## 🔄 Review & Updates

### Regular Reviews

- **Quarterly:** Review classification accuracy and procedures
- **Annually:** Comprehensive review of classification framework
- **Ad-hoc:** Review triggered by regulatory changes or incidents

### Change Management

- **Impact Assessment:** Evaluate impact of classification changes
- **Stakeholder Review:** Review changes with relevant stakeholders
- **Implementation:** Phased implementation of classification updates
- **Training Update:** Update training materials for classification changes

---

**Last Updated:** 2025-01-14  
**Next Review:** 2025-04-14  
**Document Owner:** Data Protection Team  
**Classification:** Internal

---

## 🔗 Related Documentation

- **[Security & Privacy](security-and-privacy.md):** Overall security framework
- **[LLM Usage Policy](llm-usage-policy.md):** AI-specific data handling
- **[Provider Agreement Compliance](provider-agreement-compliance.md):** AI provider compliance
- **[GDPR Compliance Documentation](gdpr-compliance-final-documentation-summary.md):** GDPR-specific procedures
