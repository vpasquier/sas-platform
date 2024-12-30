import { Tags } from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface AuroraStackProps {
  vpc: ec2.Vpc;
  mode: string;
}

export class AuroraConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AuroraStackProps) {
    super(scope, id);

    const { vpc } = props;

    new rds.DatabaseInstance(this, id, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_2,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      vpc,
      allocatedStorage: 20,
      deletionProtection: true,
    });

    Tags.of(scope).add("Environment", props.mode);
  }
}
