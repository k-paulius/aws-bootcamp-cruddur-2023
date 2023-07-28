## Bootstrapping Sequence:

#### Create CloudFormation State Bucket
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/state-bucket-name`
- run: `deploy-cfn-state-bucket`

#### Create Networking stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/networking-stack-name`
- run: `deploy-networking`

#### Create DNS Stack
- create SSM parameters:
    - `/$APP_ID/$APP_ENV/aws/cfn/dns-stack-name`
    - `/$APP_ID/$APP_ENV/domain-name`
- run: `deploy-dns`

#### Create RDS Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/db-stack-name`
- run: `deploy-db`

#### Create Authentication Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/auth-stack-name`
- run `build-auth-sam`
- run `package-auth-sam`
- run `deploy-auth-sam`

#### Create Dynamo DB Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/ddb-stack-name`
- run `build-ddb-sam`
- run `package-ddb-sam`
- run `deploy-ddb-sam`

#### Create ECR Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/ecr-stack-name`
- run: `deploy-ecr`

#### Create ECS Cluster Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/cluster-stack-name`
- run: `deploy-cluster`

#### Create ECS Service Stack for Backend
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/service-stack-name`
- run: `deploy-service`

#### Create Frontend Stack
- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/frontend-stack-name`
- run `deploy-frontend`

#### Create CI/CD Stack
- create SSM parameters:
    - `/$APP_ID/$APP_ENV/aws/cfn/cicd-stack-name`
    - `/$APP_ID/$APP_ENV/cicd/artifact-bucket-name`
    - `/$APP_ID/$APP_ENV/cicd/github-repo-name`
    - `/$APP_ID/$APP_ENV/cicd/github-branch-name`
    - `/$APP_ID/$APP_ENV/cicd/github-codestar-connection-arn`
- run `deploy-cicd`

#### Create Thumbing Stack
- bootstrap CDK (only need to do this once per environment)
    - `cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_DEFAULT_REGION"`
        - this will create 'CDKToolkit' CloudFormation stack in your account
- create SSM parameters:
    - `/$APP_ID/$APP_ENV/thumbing/uploads-bucket-name`
    - `/$APP_ID/$APP_ENV/thumbing/assets-domain-name`
- run:
    - `build-thumbing-cdk`
    - `deploy-thumbing-cdk`

#### Build and Deploy Frontend
- run
    - `../frontend/build-static-prod`
    - `bin/frontend/deploy-static-prod`

## Deploy Scripts
- `deploy-cfn-state-bucket`
    - creates CloudFormation state bucket needed for subsequent CFN template deployments

- `deploy-networking`
    - creates VPC network and supporting resources

- `deploy-dns`
    - creates Route 53 hosted zone

- `deploy-db`
    - creates RDS DB instance

- `build-auth-sam` / `package-auth-sam` / `deploy-auth-sam`
    - creates Cognito User Pool, clients for Authentication and Cognito post confirmation Lambda function

- `deploy-ecr`
    - create ECR container repositories

- `deploy-cluster`
    - creates ECS cluster, ALB, target groups

- `deploy-service`
    - creates ECS task definition, and ECS service

- `deploy-frontend`
    - creates CloudFront distribution with S3 bucket origin for frontend hosting

- `build-ddb-sam` /`package-ddb-sam` / `deploy-ddb-sam`
    - creates DynamoDB table and message-stream Lambda

- `deploy-cicd`
    - creates CodePipeline with CodeBuild build step and deployment to ECS

- `build-thumbing-cdk` / `deploy-thumbing-cdk`
    - create S3 buckets, Lambda functions, CloudFront distribution and DNS records needed for avatar upload functionality (thumbing)
