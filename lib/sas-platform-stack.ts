import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface SasPlatformStackProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  fargateService: ecs.IBaseService;
  djangoRepository: ecr.IRepository;
  djangoContainerName: string;
  connectionARN: string;
  awsAccountId: string;
}

export class SasPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SasPlatformStackProps) {
    super(scope, id, props);
  }
}
