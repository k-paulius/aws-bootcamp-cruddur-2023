#!/usr/bin/env bash

DIR_PATH=$(dirname $(readlink -f $0))
BUILD_DIR="$DIR_PATH/../../build"

APP_ID="cruddur"
APP_ENV="prod"
# Artifact Bucket
CFN_STATE_BUCKET=$(aws ssm get-parameter --name "/$APP_ID/$APP_ENV/aws/cfn/state-bucket-name" --query 'Parameter.Value' --output text)
CFN_S3_PREFIX="cfn"
SAM_S3_PREFIX="sam"

# Stack Names
DDB_STACK_NAME=$(aws ssm get-parameter --name "/${APP_ID}/${APP_ENV}/aws/cfn/ddb-stack-name" --query 'Parameter.Value' --output text)