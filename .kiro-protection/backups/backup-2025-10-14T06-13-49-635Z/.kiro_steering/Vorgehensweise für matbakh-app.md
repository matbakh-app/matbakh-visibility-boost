Best Practices (auf matbakh.app zugeschnitten)

Zwei-Spur-Ansatz (immergrün + Innovation)

Green Core Validation (GCV): Minimal-Set an Tests, das immer grün ist und Releases gate’t (Signup/Login, Kern-APIs, Deployment/Failover-Smoke, Kostenwächter).

Exploration Track: Feature-Entwicklung hinter Feature-Flags, mit leichte(m) Testnetz (charakterisierende Tests + CDCT).

Contracts stabilisieren, Implementierung austauschbar

Contract-/Consumer-Driven Tests für interne und externe APIs (z. B. Orchestratoren, HealthChecker, Auto-Scaling).

Kompatibilitäts-Shims (wie du schon nutzt) → erlauben Refactors ohne Test-Erdrutsch.

Fitness Functions als Qualitätsleitplanken

SLO-als-Tests: P95, Fehlerquote, Verfügbarkeit, Budget-Guards (50/80/100 %).

Deployment-Fitness: Blue-Green Switch, CloudFront-Invalidation, Rollback ≤ 5 min.

Multi-Region-Fitness: RTO/RPO Assertions im DR-Test.

Deterministische Tests

Keine echten sleep() im Codepfad → über “Clock/Timer Service” injizieren.

AWS SDK immer injizieren (keine new Client() im Produktcode), damit Mocks greifen.

Real HTTP nur in Smoke-/Canary-Suites, sonst lokal mocken.

Test-Portfolio

Pyramide: wenige E2E (Smoke/DR), mehr Integrations-, viele schnelle Unit-Tests.

Approval/Golden-Master dort, wo Output groß/strukturell ist (Reports, Manifeste).

Flaky-Quarantäne mit Ablaufdatum (z. B. 7 Tage) + Owner.

Trunk-based + No-Skip-Gate

“No skip reporter” aktiv lassen.

“PR muss GCV bestehen”, “Exploration-Suites dürfen gelb sein, aber werden zeitnah bereinigt”.

Strangler-Pattern für große Umbauten

Module schrittweise ersetzen (z. B. Monitoring/HealthChecker), alte und neue Pfade parallel, über Flags.

Kundenorientierung messbar machen

Kundenpfade als Tests (Happy Path & kritische Fehlerfälle).

Release-Checklisten im CI (SLO, Budget, Smoke in beiden Regionen).<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 