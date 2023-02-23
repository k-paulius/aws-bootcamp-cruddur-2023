# Week 0 — Billing and Architecture

## Required Homework

### Cruddur Diagrams

- [Cruddur Conceptual Diagram](https://lucid.app/lucidchart/48b1c3b6-dc3f-4860-a0e1-8bba39c60e5e/edit?viewport_loc=-641%2C199%2C3072%2C1588%2C0_0&invitationId=inv_28780703-4836-4753-a3ec-2c1aec05bf5f)
- [Cruddur Logical Diagram](https://lucid.app/lucidchart/8766af01-d925-41f1-99e2-d7cd46a19d8f/edit?viewport_loc=-7%2C-809%2C3072%2C1588%2Ct-LzCip71osq&invitationId=inv_46e21018-1560-4d76-ab40-bd849c8465db)

### AWS Budget Setup

```sh
# Create budget with alerts
aws budgets create-budget \
    --account-id 123456789012 \
    --budget file://monthly-10usd-budget.json \
    --notifications-with-subscribers file://notifications-with-subscribers.json

# Verify it was successfully created
aws budgets describe-budgets --account-id 123456789012
```



## Homework Challenges

### AWS Organization Structure

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

#### AWS CLI Commands for Setting up Organization

```bash
# Create organization
aws organizations create-organization

# Get Root Id
aws organizations list-roots --query Roots[0].Id --output text
# Create OUs
aws organizations create-organizational-unit --parent-id r-xxxx --name Security
aws organizations create-organizational-unit --parent-id ou-xxxx-yyyy --name Prod
# Create accounts
aws organizations create-account --email email@email.com --account-name log-archive-prod
# Move accounts to proper OU
aws organizations list-accounts
aws organizations move-account --account-id 222222222222 --source-parent-id r-xxxx --destination-parent-id ou-xxxx-yyyy
```

#### SCPs

##### Deny Actions as a Root User

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyRootUserActions",
            "Effect": "Deny",
            "Action": "*",
            "Resource": "*",
            "Condition": {
                "StringLike": {
                    "aws:PrincipalArn": "arn:aws:iam::*:root"
                }
            }
        }
    ]
}
```

##### Deny Ability to Leave Organization

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyLeaveOrganization",
            "Effect": "Deny",
            "Action": "organizations:LeaveOrganization",
            "Resource": "*"
        }
    ]
}
```

##### Restrict Region to us-east-1

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "RestrictRegion",
            "Effect": "Deny",
            "Action": "*",
            "Resource": "*",
            "Condition": {
                "StringNotEquals": {
                    "aws:RequestedRegion": [
                        "us-east-1"
                    ]
                }
            }
        }
    ]
}
```

##### Deny Ability to Delete Organization Trail KMS Key

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Deny",
            "Action": [
                "kms:ScheduleKeyDeletion",
                "kms:DisableKey"
            ],
            "Resource": "arn:aws:kms:us-east-1:123456789012:key/111-2222-3333-4444"
        }
    ]
}
```