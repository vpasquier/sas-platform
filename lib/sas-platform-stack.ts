import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ECSFargateConstruct } from "../lib/ecs-construct";
import { EcrConstruct } from "../lib/ecr-construct";
import { S3Construct } from "./s3-construct";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { AuroraConstruct } from "./aurora-construct";
import { GithubConstruct } from "./github-construct";
import * as route53 from "aws-cdk-lib/aws-route53";

interface SasPlatformStackProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  baseId: string;
  awsAccountId: string;
  backend_version: string;
  frontend_version: string;
}

export class SasPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SasPlatformStackProps) {
    super(scope, id, props);

    console.log("Starting build of Sas Platform");

    // const arnService = `arn:aws:ecr:${props.env.region}:${props.env.account}`;

    const ecrConstruct = new EcrConstruct(this, props.baseId + "-ecr", {
      mode: props.mode,
    });

    const repositoryArn = `arn:aws:ecr:${props.env.region}:${props.env.account}:repository/${ecrConstruct.repositoryName}`;

    console.log("ECR Repository ARN:", repositoryArn);

    const vpc = new ec2.Vpc(this, "sasVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/24"),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
      createInternetGateway: true,
      availabilityZones: ["us-east-1a", "us-east-1b"],
      maxAzs: 2,
      vpcName: "sasVpc",
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const vpcId = `${props.baseId}-VpcId`;
    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
      exportName: vpcId,
    });

    const s3Construct = new S3Construct(this, props.baseId + "-s3-media", {
      mode: props.mode,
    });

    const fargateConstruct = new ECSFargateConstruct(this, "FargateSasStack", {
      repository: repositoryArn,
      mode: props.mode,
      vpc: vpc,
      backend_version: props.backend_version,
      frontend_version: props.frontend_version,
      s3Bucket: s3Construct.s3Bucket,
    });

    s3Construct.s3Bucket.grantRead(fargateConstruct.taskExecutionRole);

    // const loadBalancerDnsName = fargateConstruct.loadBalancerDnsName;

    // new AuroraConstruct(this, props.baseId + "-aurora", {
    //   vpc: vpc,
    //   mode: props.mode,
    // });

    new GithubConstruct(this, props.baseId + "-github");

    const hostedZone = new route53.PublicHostedZone(this, "HostedZone", {
      zoneName: "werkdrag.com",
    });

    // const cognitoApi = new CognitoApiConstruct(this, "CognitoApiConstruct", {
    //   apiName: "WerkDrag",
    //   hostedZone: hostedZone
    // });

    // new route53.ARecord(this, "AliasRecord", {
    //   zone: hostedZone,
    //   recordName: "api.werkdrag.com",
    //   target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(cognitoApi.api)),
    // });
  }
}
