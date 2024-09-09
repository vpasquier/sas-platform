import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";

interface ECSFargateProps extends cdk.StackProps {
  cluster: ecs.Cluster;
  serviceARN: string;
}

export class ECSFargateStack extends cdk.Stack {
  readonly fargateService: ecs.IBaseService;

  constructor(scope: cdk.App, id: string, props: ECSFargateProps) {
    super(scope, id, props);
    const { cluster, serviceARN } = props;

    // Create Service Discovery namespace
    const namespace = new servicediscovery.PrivateDnsNamespace(this, `${id}-namespace`, {
      vpc: cluster.vpc,
      name: `${id}.local`,
    });

    // Create Service Discovery service
    const serviceDiscoveryService = new servicediscovery.Service(this, `${id}-service`, {
      namespace,
      name: `${id}-service`,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: cdk.Duration.minutes(5),
    });


    this.fargateService = ecs.FargateService.fromServiceArnWithCluster(this, id + "-fargateService", serviceARN);

    const repository = ecr.Repository.fromRepositoryName(this, `${id}Repository`, "sas");

    new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${id}FargateService`, {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository),
        containerPort: 5000,
      },
      publicLoadBalancer: false,
    });
  }
}
