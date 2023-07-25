#!/usr/bin/env bash

DIR_PATH=$(dirname $(readlink -f $0))
BUILD_DIR="$DIR_PATH/../../build"

# Application Info
APP_ID="cruddur"
APP_ENV="prod"
DB_PORT=5432
BACKEND_APP_PORT=4567
PRIMARY_DOMAIN=$(aws ssm get-parameter --name "/${APP_ID}/${APP_ENV}/domain-name" --query 'Parameter.Value' --output text)

# Artifact Bucket Info
CFN_STATE_BUCKET=$(aws ssm get-parameter --name "/$APP_ID/$APP_ENV/aws/cfn/state-bucket-name" --query 'Parameter.Value' --output text)
CFN_S3_PREFIX="cfn"
SAM_S3_PREFIX="sam"
ARTIFACT_BUCKET_NAME=$(aws ssm get-parameter --name "/$APP_ID/$APP_ENV/cicd/artifact-bucket-name" --query 'Parameter.Value' --output text)

# Stack Name SSM Parameters
NETWORKING_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/networking-stack-name"
DNS_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/dns-stack-name"
DB_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/db-stack-name"
ECR_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/ecr-stack-name"
CLUSTER_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/cluster-stack-name"
SERVICE_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/service-stack-name"
DDB_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/ddb-stack-name"
FRONTEND_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/frontend-stack-name"
AUTH_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/auth-stack-name"
CICD_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/cicd-stack-name"

# Stack Names
CFN_STATE_BUCKET_STACK_NAME="$APP_ID-$APP_ENV-cfn-state-bucket"
NETWORKING_STACK_NAME=$(aws ssm get-parameter --name $NETWORKING_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
DNS_STACK_NAME=$(aws ssm get-parameter --name $DNS_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
DB_STACK_NAME=$(aws ssm get-parameter --name $DB_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
ECR_STACK_NAME=$(aws ssm get-parameter --name $ECR_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
CLUSTER_STACK_NAME=$(aws ssm get-parameter --name $CLUSTER_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
SERVICE_STACK_NAME=$(aws ssm get-parameter --name $SERVICE_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
DDB_STACK_NAME=$(aws ssm get-parameter --name $DDB_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
FRONTEND_STACK_NAME=$(aws ssm get-parameter --name $FRONTEND_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
AUTH_STACK_NAME=$(aws ssm get-parameter --name $AUTH_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
CICD_STACK_NAME=$(aws ssm get-parameter --name $CICD_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
