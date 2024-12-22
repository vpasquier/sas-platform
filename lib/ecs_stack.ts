import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam"; // Import IAM

interface ECSFargateProps extends StackProps {
  cluster: ecs.Cluster;
  repository: ecr.IRepository;
}

export class ECSFargateStack extends Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly fargateService: ecs.IBaseService;
  public readonly taskRole: iam.IRole;

  constructor(scope: Construct, id: string, props: ECSFargateProps) {
    super(scope, id, props);
    const { cluster, repository } = props;

    const namespace = new servicediscovery.PrivateDnsNamespace(this, `${id}-namespace`, {
      vpc: cluster.vpc,
      name: `${id}.local`,
    });

    this.taskRole = new iam.Role(this, "TaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      // managedPolicies: [
      //   iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      // ],
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc: props.cluster.vpc,
      internetFacing: true,
    });

    const serviceDiscoveryService = new servicediscovery.Service(this, `${id}-service`, {
      namespace,
      name: `${id}-service`,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: Duration.minutes(5),
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc: props.cluster.vpc,
      internetFacing: true,
    });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, "TaskDefinition", {
      family: id,
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = fargateTaskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromEcrRepository(repository),
      portMappings: [{ containerPort: 5000 }], // Map container port
    });

    const appLoadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}FargateService`,
      {
        cluster,
        taskDefinition: fargateTaskDefinition,
        publicLoadBalancer: true,
      }
    );
    this.loadBalancer = appLoadBalancedFargateService.loadBalancer;
    this.fargateService = appLoadBalancedFargateService.service;
  }
}
