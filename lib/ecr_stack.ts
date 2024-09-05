import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface EcrProps extends cdk.StackProps {
  mode: string;
}

export class EcrStack extends cdk.Stack {
  readonly repository: ecr.IRepository;

  constructor(scope: cdk.App, id: string, props: EcrProps) {
    super(scope, id, props);

    this.repository = ecr.Repository.fromRepositoryName(this, id + "-repository", "SAS Repository");
    Tags.of(this.repository).add("Environment", props.mode);
  }
}
