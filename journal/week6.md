# Week 6 — Deploying Containers

```bash
#
# Create CloudWatch Log Group
#
aws logs create-log-group --log-group-name "/cruddur/fargate-cluster"
aws logs put-retention-policy --log-group-name "/cruddur/fargate-cluster" --retention-in-days 1

export AWS_ACCOUNT_ID=123456789012


#
# Login to ECR
#
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"

# Create Python Image repository
aws ecr create-repository \
  --repository-name cruddur-python \
  --image-tag-mutability MUTABLE
# push Python base image to ECR
export ECR_PYTHON_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/cruddur-python"
docker pull python:3.10-slim-bullseye
docker tag python:3.10-slim-bullseye $ECR_PYTHON_URL:3.10-slim-bullseye
docker push $ECR_PYTHON_URL:3.10-slim-bullseye

# Create Backend App Image repository
aws ecr create-repository \
  --repository-name backend-flask \
  --image-tag-mutability MUTABLE
# build and push backend app to ECR
export ECR_BACKEND_FLASK_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/backend-flask"
docker build -t backend-flask ./backend-flask
docker tag backend-flask:latest $ECR_BACKEND_FLASK_URL:latest
docker push $ECR_BACKEND_FLASK_URL:latest

# Create Frontend App Image repository
aws ecr create-repository \
  --repository-name frontend-react-js \
  --image-tag-mutability MUTABLE
# build and push backend app to ECR
export ECR_FRONTEND_REACT_JS_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/frontend-react-js"
docker build \
  --build-arg REACT_APP_BACKEND_URL=$(aws ssm get-parameter --name "/cruddur/frontend-react-js/REACT_APP_BACKEND_URL" --query 'Parameter.Value' --output text) \
  --build-arg REACT_APP_AWS_USER_POOLS_ID=$(aws ssm get-parameter --name "/cruddur/frontend-react-js/REACT_APP_AWS_USER_POOLS_ID" --query 'Parameter.Value' --output text) \
  --build-arg REACT_APP_CLIENT_ID=$(aws ssm get-parameter --name "/cruddur/frontend-react-js/REACT_APP_CLIENT_ID" --query 'Parameter.Value' --output text) \
  --build-arg REACT_APP_AWS_PROJECT_REGION="us-east-1" \
  --build-arg REACT_APP_AWS_COGNITO_REGION="us-east-1" \
  -t frontend-react-js \
  -f frontend-react-js/Dockerfile.prod \
  ./frontend-react-js
docker tag frontend-react-js:latest $ECR_FRONTEND_REACT_JS_URL:latest
docker push $ECR_FRONTEND_REACT_JS_URL:latest


#
# Create SSM Parameters
#
# backend app
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_ACCESS_KEY_ID" --value $AWS_ACCESS_KEY_ID
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_SECRET_ACCESS_KEY" --value $AWS_SECRET_ACCESS_KEY
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/CONNECTION_URL" --value $PROD_CONNECTION_URL
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/ROLLBAR_ACCESS_TOKEN" --value $ROLLBAR_ACCESS_TOKEN
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/OTEL_EXPORTER_OTLP_HEADERS" --value "x-honeycomb-team=$HONEYCOMB_API_KEY"
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_COGNITO_USER_POOL_ID" --value "us-east-1_abc"
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_COGNITO_USER_POOL_CLIENT_ID" --value "abc1234"
aws ssm put-parameter --type "String" --name "/cruddur/backend-flask/FRONTEND_URL" --value "https://cruddur.org"
aws ssm put-parameter --type "String" --name "/cruddur/backend-flask/BACKEND_URL" --value "https://api.cruddur.org"
# frontend app
aws ssm put-parameter --type "String" --name "/cruddur/frontend-react-js/REACT_APP_AWS_USER_POOLS_ID" --value "us-east-1_fqSpzuhBC"
aws ssm put-parameter --type "String" --name "/cruddur/frontend-react-js/REACT_APP_CLIENT_ID" --value "79kofvlfu00dlalaic46g9i966"
aws ssm put-parameter --type "String" --name "/cruddur/frontend-react-js/REACT_APP_BACKEND_URL" --value "https://api.cruddur.org"


#
# Create ECS Task Execution IAM Role
#
aws iam create-role \
  --role-name CruddurServiceExecutionRole \
  --assume-role-policy-document file://aws/policies/cruddur-svc-task-execution-role-trust-policy.json
aws iam put-role-policy \
  --policy-name CruddurServiceExecutionPolicy \
  --role-name CruddurServiceExecutionRole \
  --policy-document file://aws/policies/cruddur-svc-task-execution-role-policy.json

aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy --role-name CruddurServiceExecutionRole


#
# Create ECS Task IAM Role
#
aws iam create-role \
  --role-name CruddurTaskRole \
  --assume-role-policy-document file://aws/policies/cruddur-svc-task-role-trust-policy.json
aws iam put-role-policy \
  --policy-name SSMAccessPolicy \
  --role-name CruddurTaskRole \
  --policy-document file://aws/policies/cruddur-svc-task-role-policy.json
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess --role-name CruddurTaskRole
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess --role-name CruddurTaskRole


#
# Create Security Group for Cruddur service
#
export DEFAULT_VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault, Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text)
echo $DEFAULT_VPC_ID

export DEFAULT_SUBNET_IDS=$(aws ec2 describe-subnets  \
  --filters Name=vpc-id,Values=$DEFAULT_VPC_ID \
  --query 'Subnets[*].SubnetId' \
  --output json | jq -r 'join(",")')
echo $DEFAULT_SUBNET_IDS

export CRUD_SERVICE_SG=$(aws ec2 create-security-group \
  --group-name "crud-svc-sg" \
  --description "Security group for Cruddur services on ECS" \
  --vpc-id $DEFAULT_VPC_ID \
  --query "GroupId" --output text)
echo $CRUD_SERVICE_SG

# Allow RDS security group access from ECS SG
export DB_SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier cruddur-db-instance \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $CRUD_SERVICE_SG


#
# Create ECS Cluster
#
aws ecs create-cluster \
  --cluster-name cruddur \
  --service-connect-defaults namespace=cruddur

# Register task definitions
aws ecs register-task-definition --cli-input-json file://aws/ecs/task-definitions/backend-flask-task.json
aws ecs register-task-definition --cli-input-json file://aws/ecs/task-definitions/frontend-react-js-task.json

# Create services
aws ecs create-service --cli-input-json file://aws/ecs/services/backend-flask-service.json
aws ecs create-service --cli-input-json file://aws/ecs/services/frontend-react-js-service.json


#
# Create Elastic Load Balancer
#

# create SG for ALB
export CRUD_ALB_SG=$(aws ec2 create-security-group \
  --group-name "crud-alb-sg" \
  --description "Security group for Cruddur ALB" \
  --vpc-id $DEFAULT_VPC_ID \
  --query "GroupId" --output text)
echo $CRUD_ALB_SG
# allow traffic to ALB on port 4567 from the internet
aws ec2 authorize-security-group-ingress \
  --group-id $CRUD_ALB_SG \
  --protocol tcp \
  --port 4567 \
  --cidr "$(curl ifconfig.me)/32" 
# allow traffic to ALB on port 3000 from the internet
aws ec2 authorize-security-group-ingress \
  --group-id $CRUD_ALB_SG \
  --protocol tcp \
  --port 3000 \
  --cidr "$(curl ifconfig.me)/32" 
# allow traffic to backend-flask on port 4567 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id $(aws ec2 describe-security-groups --group-names crud-svc-sg --query 'SecurityGroups[0].GroupId' --output text) \
  --protocol tcp \
  --port 4567 \
  --source-group $(aws ec2 describe-security-groups --group-names crud-alb-sg --query 'SecurityGroups[0].GroupId' --output text)
# allow traffic to frontend-react-js on port 3000 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id $(aws ec2 describe-security-groups --group-names crud-svc-sg --query 'SecurityGroups[0].GroupId' --output text) \
  --protocol tcp \
  --port 3000 \
  --source-group $(aws ec2 describe-security-groups --group-names crud-alb-sg --query 'SecurityGroups[0].GroupId' --output text)


# create target group for backend app
aws elbv2 create-target-group \
  --name cruddur-backend-flask-tg \
  --target-type ip \
  --protocol HTTP \
  --protocol-version HTTP1 \
  --port 4567 \
  --vpc-id $(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text) \
  --health-check-protocol HTTP \
  --health-check-port 4567 \
  --health-check-enabled \
  --health-check-path "/api/health-check" \
  --healthy-threshold-count 3

# create target group for frontend app
aws elbv2 create-target-group \
  --name cruddur-frontend-react-js-tg \
  --target-type ip \
  --protocol HTTP \
  --protocol-version HTTP1 \
  --port 3000 \
  --vpc-id $(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)

# create ALB
aws elbv2 create-load-balancer \
  --name cruddur-alb \
  --scheme internet-facing \
  --ip-address-type ipv4 \
  --subnets subnet-0a599cd135190ee63 subnet-08859931b7d8c07d1 subnet-069951cbf8ec655d9 \
  --security-groups $CRUD_ALB_SG \
  --type application

# add listeners
aws elbv2 create-listener \
  --load-balancer-arn $(aws elbv2 describe-load-balancers --names cruddur-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text) \
  --protocol HTTP \
  --port 4567 \
  --default-actions Type=forward,TargetGroupArn=$(aws elbv2 describe-target-groups --names cruddur-backend-flask-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 create-listener \
  --load-balancer-arn $(aws elbv2 describe-load-balancers --names cruddur-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text) \
  --protocol HTTP \
  --port 3000 \
  --default-actions Type=forward,TargetGroupArn=$(aws elbv2 describe-target-groups --names cruddur-frontend-react-js-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
```