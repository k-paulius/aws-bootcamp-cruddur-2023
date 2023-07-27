#!/usr/bin/env bash

export DIR_PATH=$(dirname $(readlink -f $0))
export BUILD_DIR="$DIR_PATH/../../build"

# Application Info
export APP_ID="cruddur"
export APP_ENV="prod"
export DB_PORT=5432
export BACKEND_APP_PORT=4567
export PRIMARY_DOMAIN=$(aws ssm get-parameter --name "/${APP_ID}/${APP_ENV}/domain-name" --query 'Parameter.Value' --output text)

# Artifact Bucket Info
export CFN_STATE_BUCKET=$(aws ssm get-parameter --name "/$APP_ID/$APP_ENV/aws/cfn/state-bucket-name" --query 'Parameter.Value' --output text)
export CFN_S3_PREFIX="cfn"
export SAM_S3_PREFIX="sam"
export ARTIFACT_BUCKET_NAME=$(aws ssm get-parameter --name "/$APP_ID/$APP_ENV/cicd/artifact-bucket-name" --query 'Parameter.Value' --output text)

# Stack Name SSM Parameters
export NETWORKING_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/networking-stack-name"
export DNS_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/dns-stack-name"
export DB_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/db-stack-name"
export ECR_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/ecr-stack-name"
export CLUSTER_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/cluster-stack-name"
export SERVICE_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/service-stack-name"
export DDB_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/ddb-stack-name"
export FRONTEND_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/frontend-stack-name"
export AUTH_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/auth-stack-name"
export CICD_STACK_NAME_SSM_PARAM="/${APP_ID}/${APP_ENV}/aws/cfn/cicd-stack-name"

# Stack Names
export CFN_STATE_BUCKET_STACK_NAME="$APP_ID-$APP_ENV-cfn-state-bucket"
export NETWORKING_STACK_NAME=$(aws ssm get-parameter --name $NETWORKING_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export DNS_STACK_NAME=$(aws ssm get-parameter --name $DNS_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export DB_STACK_NAME=$(aws ssm get-parameter --name $DB_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export ECR_STACK_NAME=$(aws ssm get-parameter --name $ECR_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export CLUSTER_STACK_NAME=$(aws ssm get-parameter --name $CLUSTER_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export SERVICE_STACK_NAME=$(aws ssm get-parameter --name $SERVICE_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export DDB_STACK_NAME=$(aws ssm get-parameter --name $DDB_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export FRONTEND_STACK_NAME=$(aws ssm get-parameter --name $FRONTEND_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export AUTH_STACK_NAME=$(aws ssm get-parameter --name $AUTH_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
export CICD_STACK_NAME=$(aws ssm get-parameter --name $CICD_STACK_NAME_SSM_PARAM --query 'Parameter.Value' --output text)
