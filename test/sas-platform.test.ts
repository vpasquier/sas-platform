import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { EcrStack } from "../lib/ecr_stack";
import { ECSFargateStack } from "../lib/ecs_stack";
import { S3Stack } from "../lib/s3_stack";
import { Stack } from "aws-cdk-lib";
import { AuroraStack } from "../lib/aurora_stack";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { SasPlatformStack } from "../lib/sas-platform-stack";

describe("SasPlatformStack", () => {
  let stack: SasPlatformStack;

  beforeEach(() => {
    const app = new App();
    stack = new SasPlatformStack(app, "MyTestStack", {
      env: { account: "123456789012", region: "us-east-1" }, // Add region
      mode: "test",
      baseId: "test-id",
      awsAccountId: "123456789012",
    });
  });

  test("ECR Stack is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ECR::Repository", 1);
  });

  test("VPC is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::EC2::VPC", 1);
  });

  test("ECS Cluster is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ECS::Cluster", 1);
  });

  test("Application Load Balancer is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 2); // Expecting 2 load balancers
  });

  test("S3 Bucket is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::S3::Bucket", 1);
  });

  test("Aurora Database is created", () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
  });
});

describe("EcrStack", () => {
  test("Repository is created", () => {
    const app = new App();
    const stack = new EcrStack(app, "MyTestEcrStack", { env: { account: "123456789012", region: "us-east-1" } }); // Added env prop and region
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ECR::Repository", 1);
  });
});

describe("ECSFargateStack", () => {
  test("Fargate Task Definition is created", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const vpc = new ec2.Vpc(stack, "TestVpc");
    const cluster = new ecs.Cluster(stack, "TestCluster", { vpc });
    const repository = ecr.Repository.fromRepositoryName(stack, "TestRepo", "test");
    const fargateStack = new ECSFargateStack(stack, "MyTestEcsStack", { cluster, repository });
    const template = Template.fromStack(fargateStack);
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
  });
});

describe("S3Stack", () => {
  test("S3 Bucket is created", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const backendRole = new iam.Role(stack, "BackendRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    const frontendRole = new iam.Role(stack, "FrontendRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    const s3Stack = new S3Stack(app, "MyTestS3Stack", { backendTaskRole: backendRole, frontendTaskRole: frontendRole });
    const template = Template.fromStack(s3Stack);
    template.resourceCountIs("AWS::S3::Bucket", 1);
  });
});

describe("AuroraStack", () => {
  test("Aurora Database Instance is created", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const vpc = new ec2.Vpc(stack, "TestVpc");
    const auroraStack = new AuroraStack(app, "MyTestAuroraStack", { vpc });
    const template = Template.fromStack(auroraStack);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
  });
});
