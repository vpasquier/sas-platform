import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface ECSFargateProps extends StackProps {
  cluster: ecs.Cluster;
  serviceARN: string;
}

export class ECSFargateStack extends Stack {
  readonly fargateService: ecs.IBaseService;

  constructor(scope: Construct, id: string, props: ECSFargateProps) {
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
      dnsTtl: Duration.minutes(5),
    });

    // Referencing the existing Fargate service
    this.fargateService = ecs.FargateService.fromFargateServiceAttributes(this, id + "-fargateService", {
      serviceArn: serviceARN,
      cluster,
    });

    // Referencing the ECR repository
    const repository = ecr.Repository.fromRepositoryName(this, `${id}Repository`, "sas");

    // Create an Application Load Balanced Fargate Service
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
