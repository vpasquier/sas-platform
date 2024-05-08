import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as rds from '@aws-cdk/aws-rds';
import * as ecr from '@aws-cdk/aws-ecr';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

export class SasStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define VPC
    const vpc = new ec2.Vpc(this, 'SasVpc', {
      maxAzs: 2,
    });

    // Define CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SasDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: new s3.Bucket(this, 'SasPrivateBucket', {
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              lambdaFunctionAssociations: [
                {
                  eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                  lambdaFunction: new lambda.Function(this, 'SasLambdaEdgeAuth', {
                    runtime: lambda.Runtime.NODEJS_12_X,
                    handler: 'index.handler',
                    code: lambda.Code.fromAsset('lambda-edge-auth'),
                  }),
                },
              ],
            },
          ],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        acm.Certificate.fromCertificateArn(this, 'Certificate', 'YOUR_CERTIFICATE_ARN_HERE'),
        {
          aliases: ['drag-me.com'],
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          sslMethod: cloudfront.SSLMethod.SNI,
        }
      ),
    });

    // Define Cognito User Pool
    const userPool = new cognito.UserPool(this, 'SasUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    // Define API Gateway
    const api = new apigateway.RestApi(this, 'SasApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
      deployOptions: {
        stageName: 'prod',
      },
    });

    // Define Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'SasTaskDef');

    // Define Django Container
    const djangoContainer = taskDefinition.addContainer('DjangoContainer', {
      image: ecs.ContainerImage.fromRegistry('python:3.8'),
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
      },
    });

    // Define Fargate Service
    const fargateService = new ecs.FargateService(this, 'SasFargateService', {
      cluster: new ecs.Cluster(this, 'SasCluster', { vpc }),
      taskDefinition,
    });

    // Define Private S3 Bucket
    const privateBucket = new s3.Bucket(this, 'PrivateBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Define Aurora PostgreSQL
    const auroraCluster = new rds.ServerlessCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_11_9 }),
      vpc,
      scaling: {
        autoPause: cdk.Duration.minutes(5),
        minCapacity: rds.AuroraCapacityUnit.ACU_1,
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
    });

    // Define ECR Repository
    const ecrRepository = new ecr.Repository(this, 'EcrRepository');

    // Define Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
    });

    // Define Security Group for Fargate
    const fargateSecurityGroup = new ec2.SecurityGroup(this, 'FargateSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    // Add ingress rule to allow traffic from ALB
    fargateSecurityGroup.addIngressRule(loadBalancer.connections.securityGroups[0], ec2.Port.tcp(80));

    // Add egress rule to allow traffic to Aurora
    auroraCluster.connections.allowFrom(fargateSecurityGroup, ec2.Port.tcp(5432));

    // Define Target Group for Fargate Service
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      targets: [fargateService],
    });

    // Define Listener for ALB
    const listener = loadBalancer.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Output the CloudFront domain name
    new cdk.CfnOutput(this, 'CloudFrontDomainName', { value: distribution.distributionDomainName });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: api.url });
  }
}

const app = new cdk.App();

new SasStack(app, 'SasStackDev', {
  env: { region: 'us-east-1', account: process.env.CDK_DEFAULT_ACCOUNT },
});

new SasStack(app, 'SasStackProd', {
  env: { region: 'us-east-1', account: process.env.CDK_DEFAULT_ACCOUNT },
});
