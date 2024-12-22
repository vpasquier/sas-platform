import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface EcrProps extends cdk.StackProps {
  mode: string;
}

export class EcrStack extends cdk.Stack {
  public readonly repository: ecr.IRepository;

  constructor(scope: cdk.App, id: string, props: EcrProps) {
    super(scope, id, props);

    const { mode } = props;

    this.repository = new ecr.Repository(this, "Repository");

    Tags.of(this).add("Environment", mode);
  }
}
