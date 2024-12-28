import { Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface EcrProps {
  mode: string;
}

export class EcrConstruct extends Construct {
  public readonly repository: ecr.IRepository;
  public readonly repositoryName: string;

  constructor(scope: Construct, id: string, props: EcrProps) {
    super(scope, id);

    const { mode } = props;

    this.repositoryName = `${id}-repository`;
    this.repository = new ecr.Repository(this, "Repository", {
      repositoryName: this.repositoryName,
    });

    Tags.of(this).add("Environment", mode);
  }
}
