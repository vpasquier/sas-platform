import * as cdk from "aws-cdk-lib";
import { Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface EcrProps {
  mode: string;
}

export class EcrConstruct extends Construct {
  public readonly repository: ecr.IRepository;

  constructor(scope: Construct, id: string, props: EcrProps) {
    super(scope, id);

    const { mode } = props;

    this.repository = new ecr.Repository(this, "Repository", {
      repositoryName: `${id}-repository`,
    });

    Tags.of(this).add("Environment", mode);
  }
}
