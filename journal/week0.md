# Week 0 — Billing and Architecture

# AWS Setup

## AWS Organization Structure

```mermaid
flowchart TD
    classDef styleRoot fill:#1b998b;
    classDef styleOU fill:#f46036;
    classDef styleAccnt fill:#5688c7;

    root([Root]) --> infra{{Infrastructure}}
    infra --> infra_prod{{Prod}}
    root --> sandbox{{Sandbox}}
    sandbox --> sandbox-01
    root --> security{{Security}}
    security --> security_prod{{Prod}}
    security_prod --> log-archive-prod
    security_prod --> security-tooling-prod
    root --> workloads{{Workloads}}
    workloads --> workloads_prod{{Prod}}
    workloads_prod --> cruddur-prod
    root --> management

    class root styleRoot;
    class infra,sandbox,security,workloads,infra_prod,security_prod,workloads_prod styleOU;
    class management,log-archive-prod,security-tooling-prod,sandbox-01,cruddur-prod styleAccnt;
```
