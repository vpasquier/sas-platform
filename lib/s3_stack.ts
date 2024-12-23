import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

interface S3Props extends cdk.StackProps {
  ecsTaskRole: iam.IRole;
  mode: string;
}

export class S3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: S3Props) {
    super(scope, id, props);

    const { ecsTaskRole: frontendTaskRole } = props;

    const s3Bucket = new s3.Bucket(this, id, {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    s3Bucket.grantRead(frontendTaskRole);
    Tags.of(scope).add("Environment", props.mode);
  }
}
