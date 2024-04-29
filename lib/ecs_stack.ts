import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";

interface ECSFargateProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  serviceARN: string;
}

export class ECSFargateStack extends cdk.Stack {
  readonly fargateService: ecs.IBaseService;

  constructor(scope: cdk.App, id: string, props: ECSFargateProps) {
    super(scope, id, props);

    this.fargateService = ecs.FargateService.fromServiceArnWithCluster(this, id + "-fargateService", props.serviceARN);
  }
}
