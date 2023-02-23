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

### AWS CloudWatch Billing Alert

```sh
# Create SNS topic
aws sns create-topic --name billing_alarms_topic
# Subscribe to SNS topic
aws sns subscribe \
    --topic-arn "arn:aws:sns:us-east-1:123456789012:billing_alarms_topic" \
    --protocol email \
    --notification-endpoint "changeme@email.com"

# Generate JSON skeleton for CloudWatch alarm
aws cloudwatch put-metric-alarm --generate-cli-skeleton
# Create CloudWatch alarm
aws cloudwatch put-metric-alarm --cli-input-json file://cloudwatch-alarm.json
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

### AWS Organization CloudTrail Setup

Notes:
- `security-tooling-prod` account id = 311111111111
- `management` account id = 611111111111

#### Create KMS key in security-tooling-prod account

```sh
# Create key
aws kms create-key --description "Key to encrypt CloudTrail organization trail log files." --key-usage ENCRYPT_DECRYPT --key-spec SYMMETRIC_DEFAULT --origin AWS_KMS --no-multi-region
# Create key alias
aws kms create-alias --target-key-id 1111-2222-3333-4444 --alias-name "alias/OrganizationTrailKey"
# Enable key rotation
aws kms enable-key-rotation --key-id 1111-2222-3333-4444
# Set KMS key policy
aws kms put-key-policy --key-id 1111-2222-3333-4444 --policy-name default --policy file://kmsKeyPolicy.json --bypass-policy-lockout-safety-check
```

KMS key policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Enable IAM User Permissions",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::311111111111:root"
            },
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow CloudTrail to encrypt logs",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "kms:GenerateDataKey*",
            "Resource": "arn:aws:kms:us-east-1:311111111111:key/1111-2222-3333-4444",
            "Condition": {
                "StringLike": {
                    "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:611111111111:trail/*"
                },
                "StringEquals": {
                    "aws:SourceArn": "arn:aws:cloudtrail:us-east-1:611111111111:trail/OrganizationTrail"
                }
            }
        },
        {
            "Sid": "Allow CloudTrail to describe key",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "kms:DescribeKey",
            "Resource": "arn:aws:kms:us-east-1:311111111111:key/1111-2222-3333-4444",
            "Condition": {
                "StringEquals": {
                    "aws:SourceArn": "arn:aws:cloudtrail:us-east-1:611111111111:trail/OrganizationTrail"
                }
            }
        }
    ]
}
```

#### Create S3 bucket in log-archive-prod account

```bash
aws s3api create-bucket --bucket aws-org-cloudtrail-logs-n2cnxqb3otscixrv
# Enable block public access
aws s3api put-public-access-block --bucket aws-org-cloudtrail-logs-n2cnxqb3otscixrv --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,
BlockPublicPolicy=true,RestrictPublicBuckets=true
# Enable versioning
aws s3api put-bucket-versioning --bucket aws-org-cloudtrail-logs-n2cnxqb3otscixrv --versioning-configuration MFADelete=Disabled,Status=Enabled
# Disable ACL
aws s3api put-bucket-ownership-controls --bucket aws-org-cloudtrail-logs-n2cnxqb3otscixrv --ownership-controls Rules=[{ObjectOwnership=BucketOwnerEnforced}]
# Set bucket policy
aws s3api put-bucket-policy --bucket aws-org-cloudtrail-logs-n2cnxqb3otscixrv --policy file://s3BucketPolicy.json
```

S3 bucket policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudTrailAclCheck20150319",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "arn:aws:s3:::aws-org-cloudtrail-logs-n2cnxqb3otscixrv",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:611111111111:trail/OrganizationTrail"
                }
            }
        },
        {
            "Sid": "AWSCloudTrailWrite20150319",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::aws-org-cloudtrail-logs-n2cnxqb3otscixrv/AWSLogs/611111111111/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:611111111111:trail/OrganizationTrail",
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        },
        {
            "Sid": "AWSCloudTrailWrite20150319",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::aws-org-cloudtrail-logs-n2cnxqb3otscixrv/AWSLogs/o-rkes9q3ii9/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:611111111111:trail/OrganizationTrail",
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        }
    ]
}
```

#### Create Organization CloudTrail

```bash
# Enable organization CloudTrail service access
aws organizations enable-aws-service-access --service-principal cloudtrail.amazonaws.com
# Create trail
aws cloudtrail create-trail --name OrganizationTrail --s3-bucket-name aws-org-cloudtrail-logs-n2cnxqb3otscixrv --include-global-service-events --is-multi-region-trail --enable-log-file-validation --kms-key-id arn:aws:kms:us-east-1:311111111111:alias/OrganizationTrailKey --is-organization-trail
# Start logging
aws cloudtrail start-logging --name OrganizationTrail
```
- check status
```bash
aws cloudtrail get-trail --name OrganizationTrail
# check LatestNotificationAttemptSucceeded
aws cloudtrail get-trail-status --name OrganizationTrail
```
