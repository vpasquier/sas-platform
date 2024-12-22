import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ECSFargateStack } from "../lib/ecs_stack";
import { EcrStack } from "../lib/ecr_stack";
import { S3Stack } from "./s3_stack";
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

    const arnService = `arn:aws:ecr:${props.env.region}:${props.env.account}`;

    const ecrStack = new EcrStack(scope, props.baseId + "-ecr", {
      mode: props.mode,
    });

    const vpc = new ec2.Vpc(this, "sasVPC", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "sasCluster", {
      vpc,
    });

    const ecsStackBackend = new ECSFargateStack(scope, props.baseId + "-backend-ecs", {
      cluster,
      repository: ecrStack.repository,
      mode: props.mode,
    });

    const ecsStackFrontEnd = new ECSFargateStack(scope, props.baseId + "-frontend-ecs", {
      cluster,
      repository: ecrStack.repository,
      mode: props.mode,
    });

    new cloudfront.Distribution(this, "CloudFrontDistribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(ecsStackFrontEnd.loadBalancer.loadBalancerDnsName),
      },
    });

    new AuroraStack(scope, props.baseId + "-aurora", {
      vpc: vpc,
      mode: props.mode,
    });

    new S3Stack(scope, props.baseId + "-s3-media", {
      backendTaskRole: ecsStackBackend.taskRole,
      frontendTaskRole: ecsStackFrontEnd.taskRole,
      mode: props.mode,
    });
  }
}
