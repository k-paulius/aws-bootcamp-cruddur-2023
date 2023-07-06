# Week 9 — CI/CD with CodePipeline, CodeBuild and CodeDeploy

- Create SSM parameters:

```bash
aws ssm put-parameter --type "String" --name "/cruddur/build/ECR_AWS_ACCOUNT_ID" --value "123456789012"
aws ssm put-parameter --type "String" --name "/cruddur/build/ECR_AWS_REGION" --value "us-east-1"
aws ssm put-parameter --type "String" --name "/cruddur/build/BACKEND_IMAGE_REPO_NAME" --value "backend-flask"
```

- Create IAM Policies and attach them to CodeBuild service role

```bash
aws iam create-policy --policy-name "CodeBuildEcrPolicy-custom-cruddur-backend-flask-bake-image-us-east-1" --policy-document file://codebuild-backend-flask-ecr-policy.json
aws iam attach-role-policy --policy-arn "arn:aws:iam::123456789012:policy/CodeBuildEcrPolicy-custom-cruddur-backend-flask-bake-image-us-east-1" --role-name codebuild-cruddur-backend-flask-bake-image-service-role

aws iam create-policy --policy-name "CodeBuildSsmPolicy-custom-cruddur-backend-flask-bake-image-us-east-1" --policy-document file://codebuild-backend-flask-ssm-policy.json
aws iam attach-role-policy --policy-arn "arn:aws:iam::123456789012:policy/CodeBuildSsmPolicy-custom-cruddur-backend-flask-bake-image-us-east-1" --role-name codebuild-cruddur-backend-flask-bake-image-service-role
```