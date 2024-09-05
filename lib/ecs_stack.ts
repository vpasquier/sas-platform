import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

interface ECSFargateProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  serviceARN: string;
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  imageRepoName: string;
  containerPort: number;
  publicLoadBalancer?: boolean;
}

export class ECSFargateStack extends cdk.Stack {
  readonly fargateService: ecs.IBaseService;

  constructor(scope: cdk.App, id: string, props: ECSFargateProps) {
    super(scope, id, props);
    const { vpc, cluster, imageRepoName, containerPort, publicLoadBalancer = false } = props;

    this.fargateService = ecs.FargateService.fromServiceArnWithCluster(this, id + "-fargateService", props.serviceARN);

    const repository = ecr.Repository.fromRepositoryName(this, `${id}Repository`, imageRepoName);

    new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${id}FargateService`, {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        containerPort,
      },
      publicLoadBalancer,
    });
  }
}
