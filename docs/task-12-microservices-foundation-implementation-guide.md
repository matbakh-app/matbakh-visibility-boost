# Task 12: Microservices Foundation - Praxisnahe Implementation Guide

**Date**: 2025-09-22  
**Status**: Ready for Implementation  
**Dependencies**: Task 9 (Deployment), Task 10 (Auto-Scaling), Task 11 (Multi-Region)

## 🎯 Was-muss-ich-beachten-Liste für Task 12

Diese praxisnahe Liste führt Kiro zielgenau durch Architektur, Sicherheit, Betrieb, Tests und Kosten für eine enterprise-grade Microservices Foundation.

## 1) 🏗️ Architektur-Entscheidungen (fix setzen, bevor gebaut wird)

### Services zuschneiden & Ownership
- **Klare Domänenschnitte**: auth, persona, vc-start, upload, billing
- **Database per service** (logisch) + Eventing für Integrationen (EventBridge/SNS/SQS)
- **Ownership-Prinzip**: Jeder Service besitzt seine Daten und APIs vollständig

### Orchestrierung
- **ECS on Fargate** pro Umgebung & Region (eu-central-1 primär, eu-west-1 sekundär)
- **Konsistent mit Task 11**: Gleiche Regionen, gleiche Failover-Strategien
- **Capacity Providers**: FARGATE + FARGATE_SPOT für Cost-Optimization

### Service Mesh
- **AWS App Mesh** mit Envoy Sidecar je Task
- **mTLS automatisch** via ACM Private CA und SPIFFE-IDs
- **Traffic-Splits** für Canary (1-5%), Retries/Timeouts/Circuit-Breaking
- **Observability** via X-Ray und CloudWatch Metrics

### In/Out Routing
- **Intern**: Cloud Map (Service Discovery) + App Mesh (VirtualService/VirtualRouter/VirtualNode)
- **Extern**: ALB (public) → Ingress-Service → App Mesh → interne Services
- **Path-based Routing**: `/api/auth`, `/api/persona`, `/api/vc` über ALB

### Protokolle
- **REST (HTTP/1.1)** für BFF/extern und Legacy-Kompatibilität
- **gRPC (HTTP/2)** intern wenn möglich - reduziert Latenz & Payloads
- **App Mesh unterstützt** beide Protokolle nahtlos

### Konfig & Secrets
- **SSM Parameter Store** für Konfiguration (nicht-sensitiv)
- **Secrets Manager** für Credentials mit automatischer Rotation
- **Niemals Klartext** in Container Images oder Environment Variables

## 2) 🔒 Netzwerk & Sicherheit (ohne das geht nichts)

### VPC Layout
- **3 AZs** pro Region für High Availability
- **Private Subnets** für ECS Tasks (keine öffentlichen IPs)
- **Public Subnets** nur für ALB und NAT Gateways

### Kostenfalle NAT vermeiden
- **VPC Endpoints** für ECR (api+dkr), CloudWatch Logs, SSM/Secrets
- **Minimaler NAT-Traffic** durch Endpoint-Nutzung
- **Cost-Monitoring** für NAT Gateway Data Processing Charges

### Security Groups
- **Least Privilege** pro Service
- **Eingehend**: nur Mesh/ALB/abhängige Services
- **Ausgehend**: nur nötige AWS-Endpoints und Service-Dependencies
- **Port-spezifisch**: 8080 für App, 15000 für Envoy Admin, 9901 für Envoy Stats

### App Mesh mTLS
- **ACM Private CA** für Certificate Authority
- **SPIFFE-IDs** automatisch via App Mesh/Envoy für Service-Identität
- **Certificate Rotation** automatisch ohne Service-Downtime
- **Mutual Authentication** zwischen allen Services

### IAM
- **Getrennte Rollen**: taskExecutionRole (Pull/Logs) vs taskRole (AWS-Zugriffe)
- **Permissions Boundaries** zur Begrenzung maximaler Berechtigungen
- **Kein Wildcard `*`** - spezifische Resource ARNs verwenden
- **Cross-Account Access** für Multi-Region Deployments

## 3) 🐳 Compute & Images

### ECR Replikation
- **Multi-Region Replication** aktivieren (Task 11-Konformität)
- **Lifecycle Policies** für automatische Image-Bereinigung
- **Vulnerability Scanning** bei jedem Push aktiviert

### Image Build & Scan
- **GitHub Actions** → BuildKit → Trivy Security Scan → ECR push
- **Tags**: sha, env, service für eindeutige Identifikation
- **Multi-Stage Builds** für minimale Production Images
- **Distroless Base Images** für Security

### Fargate Tuning
- **Envoy Overhead**: ~0.25 vCPU/256 MB zusätzlich pro Task
- **CPU/Memory Planning** mit Sidecar einrechnen
- **Ephemeral Storage** bei Bedarf >20 GB setzen
- **Task Size Limits** beachten (0.25-4 vCPU, 512MB-30GB)

## 4) 🕸️ App Mesh – konkrete Policies (DoRs)

### VirtualRouter Routen
- **Timeouts**: Client 2-3s, Max 5s für externe APIs
- **Retry**: 5xx, connect-failure, gateway-error, retriable-status
- **Backoff**: 25-250ms mit Jitter für Thundering Herd Prevention
- **Max Retries**: 3-5 je nach Service-Kritikalität

### Circuit Breaking/OutlierDetection
- **Max Connections**: 1024 pro Upstream Service
- **Ejection**: 5xx ratio >50% für 30s Base Ejection
- **Max Ejection**: 300s, Max 50% der Instances
- **Health Check**: Interval 30s, Timeout 5s

### Traffic Splits
- **Canary**: 1-5% über VirtualRouter → neue VirtualNode-Version
- **Promotion**: Schrittweise 5% → 25% → 50% → 100%
- **Rollback**: Sofort auf 0% bei Fehlern
- **Integration** mit Health Gates (Task 9/10)

## 5) 🔍 Service Discovery & Load Balancing

### AWS Cloud Map
- **Namespace**: `svc.local` (intern)
- **DNS Records**: A/AAAA + SRV für Port-Discovery
- **TTL**: 5-10s (Trade-off: DNS Churn vs. Reaktionszeit)
- **Health Checks**: Custom Config mit Failure Threshold

### ALB Configuration
- **Path-based Routing**: `/api/auth`, `/api/persona`, `/api/vc`
- **Target Groups**: Ein Target Group pro Service
- **Health Checks**: `/health` Endpoint mit 200 OK
- **Integration**: Mit bestehender CloudFront Distribution

### Load Balancing Algorithmus
- **Round Robin** für gleichmäßige Verteilung
- **Least Outstanding Requests** für Performance-kritische Services
- **Sticky Sessions** nur wenn absolut notwendig (stateless bevorzugt)

## 6) 🔄 Inter-Service Kommunikation (Patterns)

### Sync (Mesh)
- **gRPC/HTTP** mit mTLS für Service-to-Service
- **Idempotenz-Keys** bei "at-least-once" Calls
- **Timeout Hierarchie**: Client < Service < Infrastructure
- **Request IDs** für End-to-End Tracing

### Async (Eventing)
- **EventBridge/SNS+SQS** für lose Kopplung
- **Outbox-Pattern** für Transaktionssicherheit
- **Sagas** für verteilte Workflows
- **Dead Letter Queues** für Failed Message Handling

### Schema-Governance
- **API-Verträge**: OpenAPI für REST, protobuf für gRPC
- **Schema-Registry**: Repository-intern + CI-Checks
- **Backward Compatibility** für Rolling Updates
- **Version Strategy**: Semantic Versioning für APIs

## 7) 📊 Observability (Pflichtprogramm)

### Logging
- **JSON strukturiert** mit einheitlichem Schema
- **Correlation ID/Trace ID** in jedem Log-Entry
- **Log Levels**: ERROR, WARN, INFO, DEBUG mit Environment-spezifischen Levels
- **Centralized Logging** via CloudWatch Logs mit Retention Policies

### Tracing
- **ADOT Collector** Sidecar/Daemon → AWS X-Ray
- **W3C Traceparent** Propagation zwischen Services
- **Sampling Rate**: 10% in Production, 100% in Development
- **Custom Spans** für Business Logic Tracing

### Metrics
- **RED Metrics**: Requests, Errors, Duration pro Service
- **USE Metrics**: Utilization, Saturation, Errors für Resources
- **Custom Metrics**: Business-spezifische KPIs
- **Namespace**: `matbakh/microservices/{service}`

### Dashboards & Alarms
- **CloudWatch Dashboards** pro Service und Gesamt-Overview
- **Alarme**: P95+P99 Latency, Error Rate >1%, 5xx Rate
- **Composite Alarms** für Service Health Status
- **Integration** mit bestehenden Monitoring (Task 1)

## 8) 📈 Autoscaling (Abgleich mit Task 10)

### ECS Service Auto Scaling
- **CPU**: 60-70% Target für normale Services
- **Memory**: 70-80% Target für Memory-intensive Services
- **Custom Metrics**: SQS QueueDepth → Tasks, ALB RequestCount
- **Scaling Policies**: Target Tracking + Step Scaling für Burst

### Lambda vs ECS Entscheidung
- **Provisioned Concurrency** bleibt für Latency-kritische Lambda-Routen
- **ECS Services** für längerlaufende, stateful Services
- **Hybrid Approach**: Schrittweise Migration ohne Doppelzuständigkeit
- **Cost Comparison** pro Endpoint dokumentieren

### Budgets
- **€100/Monat** Baseline (bis €200 mit Approval)
- **NAT-Reduktion** durch VPC Endpoints
- **Right-Sizing** basierend auf Monitoring
- **Envoy-Overhead** in Budget-Planung einrechnen

## 9) 🚀 CI/CD & Rollouts (nahtlos mit Task 9)

### Pipeline
1. **Lint/Unit** → Code Quality Gates
2. **Image Build+Scan** → Security Validation
3. **Deploy to Staging** → Integration Testing
4. **Mesh-Canary** (1-5%) → Performance Validation
5. **Gates** (QA, Perf, A11y) → Quality Assurance
6. **Promote** to 100% → Full Deployment
7. **Production** → Live Traffic

### Blue/Green mit ECS
- **App Mesh Route Split** (empfohlen) für Traffic Control
- **ECS Deployments** (minimum healthy 100%, max 200%) als Fallback
- **Health Gates** aus Task 9 für Deployment Validation
- **Automated Rollback** bei Gate Failures

### Rollback
- **VirtualRouter Weight** → sofort auf vorherige VirtualNode
- **Orchestrator** (Task 9) bekommt "container"-Modus
- **Database Migrations** separat mit Forward/Backward Compatibility
- **Feature Flags** für Business Logic Rollback

## 10) 💾 Daten & Konsistenz

### Database per Service
- **Jeder Service** sein Datenbesitz
- **Keine Cross-DB Queries** zwischen Services
- **Shared Nothing** Architecture
- **Data Access Layer** pro Service

### Konsistenz-Patterns
- **Lesemodelle** via Replikate/Caches
- **Eventual Consistency** akzeptieren und kommunizieren
- **Sagas/Outbox** für Distributed Transactions
- **Idempotenz** über Request-Keys

### Event Sourcing (Optional)
- **Event Store** für Audit und Replay
- **CQRS** für Read/Write Separation
- **Snapshots** für Performance
- **Event Versioning** für Schema Evolution

## 11) 🧪 Tests & Qualität (von Anfang an, nicht hinten anhängen)

### Test Pyramid
- **Unit** (Service Logik, Retry/Timeout/Circuit Tests)
- **Contract Tests** (Pact / protobuf compatibility)
- **Integration** (LocalStack + docker-compose der Services)
- **E2E** (Minimal, nur Critical User Journeys)

### Resilience/Chaos
- **Fault Injection** (Envoy HTTP faults)
- **App Mesh Outlier Detection** Tests
- **Network Partitions** Simulation
- **Service Unavailability** Testing

### Performance
- **k6/Artillery** gegen Mesh Canary
- **SLO-Checks** (P95<200ms prod)
- **Load Testing** für Capacity Planning
- **Baseline Establishment** für Regression Detection

### Security
- **Trivy** Container Scanning
- **IAM Access Analyzer** für Permissions
- **mTLS-Verifikation** Tests
- **Secret Rotation** Testing

## 12) 🔄 Migration & Betriebsführung

### Strangler-Fig Pattern
- **Bestehende Lambda-Endpunkte** schrittweise hinter Ingress → Mesh schalten
- **Stück für Stück** in ECS überführen
- **Feature Flags** für Traffic Routing Control
- **Parallel Running** während Migration

### Runbooks
- **Incident Response**: Mesh Route Rollback, Service Restart
- **Throttling/Backoff** erhöhen bei Overload
- **DLQ Drain** Procedures
- **Hotfix Deploy** via weight=0→5% Testing

### Quotas & Limits
- **ECS Tasks/Subnet** ENI Limits beachten
- **App Mesh** Resource Limits (1000 Virtual Nodes)
- **ECR Rate Limits** für Image Pulls
- **Cloud Map** Service Limits (1000 Services)

## 📋 Mini-DoD für Task 12 (Definition of Done)

### Infrastructure (CDK Stacks)
- [ ] **VPC** (mit Endpoints) für Cost-Optimization
- [ ] **ECR** mit Multi-Region Replication
- [ ] **ECS/Fargate Cluster** mit Container Insights
- [ ] **Cloud Map** für Service Discovery
- [ ] **App Mesh** (mesh + vs/vn/vr) mit mTLS
- [ ] **ALB Ingress** mit Path-based Routing

### Services
- [ ] **2 Referenzservices** (auth, persona) als ECS Services
- [ ] **Envoy Sidecar** mit mTLS aktiv
- [ ] **Health Checks** für ECS und ALB
- [ ] **Structured Logging** mit Correlation IDs

### App Mesh Policies
- [ ] **Timeouts** (2-5s) konfiguriert
- [ ] **Retries** (3x mit Backoff) implementiert
- [ ] **OutlierDetection** (5xx ejection) aktiv
- [ ] **Canary 1-5%** Traffic Split funktional

### CI/CD
- [ ] **Build+Scan** → Staging → Canary → Gates → Promote
- [ ] **Rollback** über Route Weights funktional
- [ ] **Health Gates** aus Task 9 integriert
- [ ] **Security Scanning** mit Trivy aktiv

### Observability
- [ ] **Logs+Metrics+Tracing** (ADOT/X-Ray) funktional
- [ ] **Dashboards** für Service Mesh Visibility
- [ ] **Alarme** für P95 Latency und Error Rate
- [ ] **Correlation IDs** End-to-End verfolgbar

### Tests
- [ ] **Unit Tests** für Service Logic
- [ ] **Contract Tests** für API Compatibility
- [ ] **Integration Tests** mit LocalStack
- [ ] **Canary Performance** Smoke Tests

### Cost & Security
- [ ] **NAT-Traffic niedrig** (VPCEs aktiv)
- [ ] **Tasks right-sized** mit Envoy Overhead
- [ ] **Budget-Alarme** aktiv und getestet
- [ ] **IAM Least Privilege** validiert

## 🚀 Startbefehle (ohne Rückfragen, direkt ausführbar)

### Infrastructure (CDK)
```bash
npm run cdk:bootstrap && npm run cdk:deploy microservices-foundation --all --profile matbakh-dev
```

### Images
```bash
npm run svc:build && npm run svc:scan && npm run svc:push
```

### Deploy Services
```bash
npm run deploy:svc -- --env staging --mesh-canary 5
```

### Promote/Rollback
```bash
# Promote to full traffic
npm run mesh:promote -- --service persona --to 100

# Emergency rollback
npm run mesh:rollback -- --service persona
```

### Health Check
```bash
# Service health
npm run health:check --service persona --region eu-central-1

# Mesh status
npm run mesh:status --all-services
```

### Monitoring
```bash
# Real-time metrics
npm run metrics:watch --service persona

# Performance analysis
npm run perf:analyze --service persona --duration 1h
```

## 🎯 Erfolgs-Kriterien

Wenn diese Punkte beachtet werden, erhalten wir eine:

- **Robuste** Microservices-Basis mit Circuit Breaking und Retry Logic
- **Sichere** Architektur mit mTLS und Least-Privilege IAM
- **Beobachtbare** Services mit End-to-End Tracing und Metrics
- **Kostenbewusste** Implementation mit VPC Endpoints und Right-Sizing
- **Saubere Integration** mit bestehenden Task 9-11 Bausteinen
- **10x-Ambition** Support für Latenz, Zuverlässigkeit, Developer-Erlebnis

Diese Foundation unterstützt die Skalierung auf hunderte von Services bei gleichbleibender Operational Excellence und Cost Efficiency.

---

**Implementation Guide Status**: ✅ **READY FOR EXECUTION**  
**Dependencies**: Task 9 ✅, Task 10 ✅, Task 11 ✅  
**Next Step**: Begin with Infrastructure Foundation Setup (Task 12.1)  