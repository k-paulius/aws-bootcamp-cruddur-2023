## Bootstrapping Sequence:

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/state-bucket-name`
- run: `deploy-cfn-state-bucket`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/networking-stack-name`
- run: `deploy-networking`

- create SSM parameters:
    - `/$APP_ID/$APP_ENV/aws/cfn/dns-stack-name`
    - `/$APP_ID/$APP_ENV/domain-name`
- run: `deploy-dns`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/db-stack-name`
- run: `deploy-db`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/auth-stack-name`
- run `build-auth-sam`
- run `package-auth-sam`
- run `deploy-auth-sam`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/ecr-stack-name`
- run: `deploy-ecr`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/cluster-stack-name`
- run: `deploy-cluster`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/service-stack-name`
- run: `deploy-service`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/frontend-stack-name`
- run `deploy-frontend`

- create SSM parameter: `/$APP_ID/$APP_ENV/aws/cfn/ddb-stack-name`
- run `build-ddb-sam`
- run `package-ddb-sam`
- run `deploy-ddb-sam`

- create SSM parameters:
    - `/$APP_ID/$APP_ENV/aws/cfn/cicd-stack-name`
    - `/$APP_ID/$APP_ENV/cicd/artifact-bucket-name`
    - `/$APP_ID/$APP_ENV/cicd/github-repo-name`
    - `/$APP_ID/$APP_ENV/cicd/github-branch-name`
    - `/$APP_ID/$APP_ENV/cicd/github-codestar-connection-arn`
- run `deploy-cicd`

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
