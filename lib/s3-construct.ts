import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface S3Props {
  mode: string;
}

export class S3Construct extends Construct {
  public readonly s3Bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: S3Props) {
    super(scope, id);

    this.s3Bucket = new s3.Bucket(this, id, {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    Tags.of(scope).add("Environment", props.mode);
  }
}
