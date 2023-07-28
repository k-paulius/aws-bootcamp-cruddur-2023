import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_apigatewayv2 as apigwv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotenv.config());

export class ThumbingServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const appId: string = process.env.APP_ID as string;
    const appEnv: string = process.env.APP_ENV as string;
    const frontendOrigin: string = process.env.FRONTEND_ORIGIN as string;
    const assetsBucketName: string = process.env.THUMBING_ASSETS_BUCKET_NAME as string;
    const uploadsBucketName: string = process.env.THUMBING_UPLOADS_BUCKET_NAME as string;
    const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
    const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;

    // create a new uploads bucket and import existing assets bucket
    const uploadsBucket = this.createUploadsBucket(uploadsBucketName, frontendOrigin);
    const assetsBucket = this.createAssetsBucket(assetsBucketName);

    // create ThumbLambda
    const lambda = this.createLambda(appId, appEnv, functionPath, assetsBucketName, folderOutput);

    // add S3 event notification to uploads bucket; triggers ThumbLambda
    this.createS3NotifyToLambda(lambda, uploadsBucket);

    // create policies
    const s3UploadsReadWritePolicy = this.createPolicyBucketAccess(uploadsBucket.bucketArn)
    const s3AssetsReadWritePolicy = this.createPolicyBucketAccess(assetsBucket.bucketArn)
    lambda.addToRolePolicy(s3UploadsReadWritePolicy);
    lambda.addToRolePolicy(s3AssetsReadWritePolicy);

    // create a Lambda for avatar presigned S3 URL generation
    const avatarPresignedS3URLFn = this.createAvatarPresignedS3URLFn(appId, appEnv, uploadsBucket);
    // create API Gateway
    const cfnApi = this.createAPIGateway(appId, appEnv, frontendOrigin);
    const cognitoUserPoolId = cdk.Fn.importValue(`${appId}-${appEnv}-auth-UserPoolId`);
    const cognitoUserPoolClientId = cdk.Fn.importValue(`${appId}-${appEnv}-auth-UserPoolClientId`);
    const cfnAuthorizer = this.createAPIGatewayAuthorizer(cfnApi, cognitoUserPoolId, cognitoUserPoolClientId);
    const avatarPresignedS3URLIntegration = this.createAvatarPresignedS3URLIntegration(cfnApi, avatarPresignedS3URLFn);
    const AvatarsKeyUploadRouteMethod = 'POST'
    const AvatarsKeyUploadRoutePath = '/avatars/key_upload'
    this.createAvatarsKeyUploadRoute(cfnApi, cfnAuthorizer, avatarPresignedS3URLIntegration, AvatarsKeyUploadRouteMethod, AvatarsKeyUploadRoutePath);
    this.createLambdaResourcePolicy(avatarPresignedS3URLFn, cfnApi, AvatarsKeyUploadRouteMethod, AvatarsKeyUploadRoutePath);
    this.createDefaultAPIStage(cfnApi);

    // exports
    new cdk.CfnOutput(this, "oApiEndpoint", {
      value: cfnApi.attrApiEndpoint,
      exportName: `${cdk.Stack.of(this).stackName}-ApiEndpoint`,
    });
  }

  createUploadsBucket(bucketName: string, frontendOrigin: string): s3.IBucket {
    const bucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    const corsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.PUT],
      allowedOrigins: [frontendOrigin],
      allowedHeaders: [
        '*'
      ],
      exposedHeaders: [
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-id-2'
      ],
      id: 'frontend-origin',
      maxAge: 3000,
    };
    bucket.addCorsRule(corsRule);
    return bucket;
  }

  createAssetsBucket(bucketName: string): s3.IBucket {
    const bucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
    return bucket;
  }

  createLambda(appId: string, appEnv: string, functionPath: string, bucketName: string, folderOutput: string): lambda.IFunction {
    const lambdaFunction = new lambda.Function(this, 'ThumbLambda', {
      functionName: `${appId}-${appEnv}-thumb-processing`,
      description: 'Process new avatar images',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(functionPath),
      environment: {
        DEST_BUCKET_NAME: bucketName,
        FOLDER_OUTPUT: folderOutput,
        PROCESS_WIDTH: '512',
        PROCESS_HEIGHT: '512'
      }
    });
    return lambdaFunction;
  }

  createS3NotifyToLambda(lambda: lambda.IFunction, bucket: s3.IBucket): void {
    const destination = new s3n.LambdaDestination(lambda);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      destination
    );
  }

  createPolicyBucketAccess(bucketArn: string): iam.PolicyStatement {
    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject'
      ],
      resources: [
        `${bucketArn}/*`
      ]
    });
    return s3ReadWritePolicy;
  }

  createAvatarPresignedS3URLFn(appId: string, appEnv: string, uploadsBucket: s3.IBucket): lambda.IFunction {
    const fn = new lambda.Function(this, 'AvatarPresignedS3URLFn', {
      functionName: `${appId}-${appEnv}-avatar-presigned-s3-url`,
      description: 'Create pre-signed S3 URL for new avatar upload',
      runtime: lambda.Runtime.RUBY_2_7,
      handler: 'function.handler',
      code: lambda.Code.fromAsset("../aws/lambdas/avatar-upload-s3-url"),
      environment: {
        THUMBING_UPLOADS_BUCKET_NAME: uploadsBucket.bucketName
      }
    });
    const policy = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [`${uploadsBucket.bucketArn}/*`]
    });
    fn.addToRolePolicy(policy);
    return fn
  }

  createLambdaResourcePolicy(fn: lambda.IFunction, cfnApi: apigwv2.CfnApi, routeMethod: string, routePath: string) {
    // Allow API Gateway to invoke the Lambda function
    fn.addPermission('APIServiceInvocation', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:${cfnApi.attrApiId}/*/${routeMethod}${routePath}`
    });
  }

  createAPIGateway(appId: string, appEnv: string, frontendOrigin: string): apigwv2.CfnApi {
    const cfnApi = new apigwv2.CfnApi(this, 'CruddurThumbHTTPApi', {
      name: `${appId}-${appEnv}-thumbing-http-api`,
      description: 'Cruddur Thumbing API ',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowCredentials: false,
        allowHeaders: ['authorization', 'content-type'],
        allowMethods: ['POST'],
        allowOrigins: [frontendOrigin],
        exposeHeaders: [],
        maxAge: 0,
      },
      disableExecuteApiEndpoint: false,
      routeSelectionExpression: '${request.method} ${request.path}'
    });
    return cfnApi;
  }

  createAPIGatewayAuthorizer(cfnApi: apigwv2.CfnApi, cognitoUserPoolId: string, cognitoUserPoolClientId: string): apigwv2.CfnAuthorizer {
    const cfnAuthorizer = new apigwv2.CfnAuthorizer(this, 'jwtAuthorizer', {
      name: 'jwtAuthorizer',
      apiId: cfnApi.attrApiId,
      authorizerType: 'JWT',
      identitySource: ['$request.header.Authorization'],
      jwtConfiguration: {
        audience: [cognitoUserPoolClientId],
        issuer: `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${cognitoUserPoolId}`
      },
    });
    return cfnAuthorizer;
  }

  createAvatarPresignedS3URLIntegration(cfnApi: apigwv2.CfnApi, fn: lambda.IFunction): apigwv2.CfnIntegration {
    const cfnIntegration = new apigwv2.CfnIntegration(this, 'AvatarPresignedS3URLIntegration', {
      apiId: cfnApi.attrApiId,
      description: '',
      integrationType: 'AWS_PROXY',
      connectionType: 'INTERNET',
      integrationMethod: 'POST',
      integrationUri: fn.functionArn,
      payloadFormatVersion: '2.0',
      timeoutInMillis: 30000
    });
    return cfnIntegration;
  }

  createAvatarsKeyUploadRoute(cfnApi: apigwv2.CfnApi, cfnAuthorizer: apigwv2.CfnAuthorizer, integration: apigwv2.CfnIntegration, routeMethod: string, routePath: string) {
    const cfnRoute = new apigwv2.CfnRoute(this, 'AvatarsKeyUploadRout', {
      routeKey: `${routeMethod} ${routePath}`,
      apiId: cfnApi.attrApiId,
      apiKeyRequired: false,
      authorizationType: 'JWT',
      authorizerId: cfnAuthorizer.attrAuthorizerId,
      target: `integrations/${integration.ref}`
    });
    return cfnRoute;
  }

  createDefaultAPIStage(cfnApi: apigwv2.CfnApi): apigwv2.CfnStage {
    const cfnStage = new apigwv2.CfnStage(this, 'DefaultAPIStage', {
      apiId: cfnApi.attrApiId,
      stageName: '$default',
      description: 'Default Stage',
      autoDeploy: true,
      defaultRouteSettings: {
        detailedMetricsEnabled: false,
      },
      routeSettings: {},
      stageVariables: {}
    });
    return cfnStage;
  }
}