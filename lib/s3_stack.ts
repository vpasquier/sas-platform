import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

interface S3Props extends cdk.StackProps {
  backendTaskRole: iam.IRole;
  frontendTaskRole: iam.IRole;
}

export class S3Stack extends cdk.Stack {
  readonly repository: ecr.IRepository;

  constructor(scope: cdk.App, id: string, props: S3Props) {
    super(scope, id, props);

    const { backendTaskRole, frontendTaskRole } = props;

    const s3Bucket = new s3.Bucket(this, id, {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    s3Bucket.grantReadWrite(backendTaskRole);
    s3Bucket.grantRead(frontendTaskRole);
    if (props.env?.account !== undefined) {
      Tags.of(this.repository).add("Environment", `${props.env?.account}`);
    }
  }
}
