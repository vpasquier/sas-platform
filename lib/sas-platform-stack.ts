import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ECSFargateStack } from "../lib/ecs_stack";
import { EcrStack } from "../lib/ecr_stack";
import { S3Stack } from "./s3_stack";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { AuroraStack } from "./aurora_stack";
import { IpAddresses } from "aws-cdk-lib/aws-ec2";

interface SasPlatformStackProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  baseId: string;
  awsAccountId: string;
}

export class SasPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SasPlatformStackProps) {
    super(scope, id, props);

    console.log("Starting build of Sas Platform");

    const arnService = `arn:aws:ecr:${props.env.region}:${props.env.account}`;

    const ecrStack = new EcrStack(this, props.baseId + "-ecr", {
      mode: props.mode,
    });

    const vpc = new ec2.Vpc(this, "sasVpc", {
      ipAddresses: ec2.IpAddresses.cidr("12.0.0.0/20"),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    const vpcId = `${props.baseId}-VpcId`;
    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
      exportName: vpcId,
    });

    const cluster = new ecs.Cluster(this, "sasCluster", {
      vpc,
      clusterName: `${props.baseId}-sasCluster`,
    });

    const fargateStack = new ECSFargateStack(this, "FargateSasStack", {
      cluster,
      repository: ecrStack.repository,
      mode: props.mode,
      vpcId: vpcId,
    });

    const loadBalancerDnsName = cdk.Fn.importValue(`${props.baseId}-FargateSasStack-LoadBalancerDNS`);

    new cloudfront.Distribution(this, "CloudFrontDistribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(loadBalancerDnsName),
      },
    });

    new AuroraStack(scope, props.baseId + "-aurora", {
      vpc: vpc,
      mode: props.mode,
    });

    new S3Stack(scope, props.baseId + "-s3-media", {
      ecsTaskRole: fargateStack.taskRole,
      mode: props.mode,
    });
  }
}
