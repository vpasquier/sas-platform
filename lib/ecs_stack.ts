import { Stack, StackProps, Duration, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { IRole, ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface ECSFargateProps extends StackProps {
  cluster: ecs.ICluster;
  repository: ecr.IRepository;
  vpcId: string;
  mode: string;
}

export class ECSFargateStack extends Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly fargateService: ecs.IBaseService;
  public readonly taskRole: IRole;
  public readonly loadBalancerDnsName: string;

  constructor(scope: Construct, id: string, props: ECSFargateProps) {
    super(scope, id, props);

    const vpc =
      props.mode === "test"
        ? ec2.Vpc.fromVpcAttributes(this, "MockVpc", {
            vpcId: "vpc-12345678",
            availabilityZones: ["us-east-1a", "us-east-1b"],
            publicSubnetIds: ["subnet-1234", "subnet-5678"],
          })
        : ec2.Vpc.fromLookup(scope, "ImportedVpc", {
            vpcId: props.vpcId,
          });

    const namespace = new servicediscovery.PrivateDnsNamespace(this, `${id}-namespace`, {
      vpc: vpc,
      name: `${id}.local`,
    });

    this.taskRole = new Role(this, "SasTaskExecutionRole", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")],
    });

    new servicediscovery.Service(this, `${id}-service`, {
      namespace,
      name: `${id}-service`,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: Duration.minutes(5),
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(scope, `${id}SasLoadBalancer`, {
      vpc: vpc,
      internetFacing: true,
    });

    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(scope, `${id}TaskDefinition`, {
      family: id,
      memoryLimitMiB: 512,
      cpu: 256,
    });

    fargateTaskDefinition.addContainer("BackEnd", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "sas-backend@latest"),
      portMappings: [{ containerPort: 8000 }],
    });

    fargateTaskDefinition.addContainer("FrontEnd", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "sas-frontend@latest"),
      portMappings: [{ containerPort: 3000 }],
    });

    const appLoadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}FargateService`,
      {
        cluster: props.cluster,
        taskDefinition: fargateTaskDefinition,
        publicLoadBalancer: true,
      }
    );
    this.loadBalancer = appLoadBalancedFargateService.loadBalancer;
    this.fargateService = appLoadBalancedFargateService.service;
    Tags.of(scope).add("Environment", props.mode);
  }
}
