import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface AuroraStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class AuroraStack extends cdk.Stack {
  readonly repository: ecr.IRepository;

  constructor(scope: cdk.App, id: string, props: AuroraStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    new rds.DatabaseInstance(this, id, {
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      vpc,
      allocatedStorage: 20,
      deletionProtection: true,
    });

    if (props.env?.account !== undefined) {
      Tags.of(this.repository).add("Environment", `${props.env?.account}`);
    }
  }
}
