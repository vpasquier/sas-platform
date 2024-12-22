import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ECSFargateStack } from "../lib/ecs_stack";
import { EcrStack } from "../lib/ecr_stack";
import { S3Stack } from "./s3_stack";
import * as rds from "aws-cdk-lib/aws-rds";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { AuroraStack } from "./aurora_stack";

interface SasPlatformStackProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  baseId: string;
  awsAccountId: string;
}

export class SasPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SasPlatformStackProps) {
    super(scope, id, props);

    // ECR
    const ecrStack = new EcrStack(scope, props.baseId + "-ecr", {
      env: props.env,
    });

    // Create a VPC
    const vpc = new ec2.Vpc(this, "sasVPC", {
      maxAzs: 2,
    });

    // Create an ECS cluster within the VPC
    const cluster = new ecs.Cluster(this, "sasCluster", {
      vpc,
    });

    const ecsStackBackend = new ECSFargateStack(scope, props.baseId + "-backend-ecs", {
      cluster,
      repository: ecrStack.repository,
    });

    const ecsStackFrontEnd = new ECSFargateStack(scope, props.baseId + "-frontend-ecs", {
      cluster,
      repository: ecrStack.repository,
    });

    new AuroraStack(scope, props.baseId + "-aurora", {
      vpc: vpc,
    });

    const distribution = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(ecsStackFrontEnd.loadBalancer.loadBalancerDnsName),
      },
    });

    new S3Stack(scope, props.baseId + "-s3-media", {
      backendTaskRole: ecsStackBackend.taskRole,
      frontendTaskRole: ecsStackFrontEnd.taskRole,
    });
  }
}
