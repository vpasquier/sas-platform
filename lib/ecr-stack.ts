import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";

interface EcrProps extends cdk.StackProps {
  mode: String;
  django_ecr_name: string;
}

export class EcrStack extends cdk.Stack {
  readonly djangoRepository: ecr.IRepository;

  constructor(scope: cdk.App, id: string, props: EcrProps) {
    super(scope, id, props);

    this.djangoRepository = ecr.Repository.fromRepositoryName(this, id + "-django-Repository", props.django_ecr_name);
  }
}
