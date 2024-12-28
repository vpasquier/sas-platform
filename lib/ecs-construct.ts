import { Duration, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { IRole, ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

interface ECSFargateProps {
  repository: ecr.IRepository;
  vpc: ec2.IVpc;
  mode: string;
}

export class ECSFargateConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly fargateService: ecs.IBaseService;
  public readonly taskRole: IRole;
  public readonly loadBalancerDnsName: string;

  constructor(scope: Construct, id: string, props: ECSFargateProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, "sasCluster", {
      vpc: props.vpc,
      clusterName: `sas-dev`,
    });

    const namespace = new servicediscovery.PrivateDnsNamespace(this, `${id}-namespace`, {
      vpc: props.vpc,
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
      vpc: props.vpc,
      internetFacing: true,
    });

    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    const fargateBackendTask = new ecs.FargateTaskDefinition(scope, `backend-task`, {
      family: id,
      memoryLimitMiB: 512,
      cpu: 256,
    });
    const fargateFrontendTask = new ecs.FargateTaskDefinition(scope, `frontend-task`, {
      family: id,
      memoryLimitMiB: 512,
      cpu: 256,
    });

    fargateBackendTask.addContainer("BackEnd", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "sas-backend@latest"),
      portMappings: [{ containerPort: 8000 }],
    });

    fargateFrontendTask.addContainer("FrontEnd", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, "sas-frontend@latest"),
      portMappings: [{ containerPort: 3000 }],
    });

    const appLoadBalancedBackendService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}BackendFargateService`,
      {
        cluster: cluster,
        taskDefinition: fargateBackendTask,
        publicLoadBalancer: false,
      }
    );

    const appLoadBalancedFrontendService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}FrontendFargateService`,
      {
        cluster: cluster,
        taskDefinition: fargateFrontendTask,
        publicLoadBalancer: true,
      }
    );

    new cloudfront.Distribution(this, `${id}FrontendDistribution`, {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(appLoadBalancedFrontendService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    this.loadBalancer = appLoadBalancedFrontendService.loadBalancer;
    this.fargateService = appLoadBalancedFrontendService.service;
    Tags.of(scope).add("Environment", props.mode);
  }
}
