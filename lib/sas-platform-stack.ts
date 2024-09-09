import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ECSFargateStack } from "../lib/ecs_stack";
import { EcrStack } from "../lib/ecr_stack";

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
    const ecr_stack = new EcrStack(scope, props.baseId + "-ecr", {
      env: props.env,
      mode: props.mode,
    });

    // Create a VPC
    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
    });

    // Create an ECS cluster within the VPC
    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc,
    });

    const ecs_stack_backend = new ECSFargateStack(scope, props.baseId + "-ecs", {
      cluster,
      serviceARN: `arn:aws:ecs:${props.env.region}:${props.env.account}:service/${props.baseId}-backend`,
    });

    const ecs_stack_frontend = new ECSFargateStack(scope, props.baseId + "-ecs", {
      cluster,
      serviceARN: `arn:aws:ecs:${props.env.region}:${props.env.account}:service/${props.baseId}-front`,
    });
  }
}
