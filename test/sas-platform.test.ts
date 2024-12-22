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

// Mock necessary constructs.  Adjust these mocks based on your actual stack dependencies!
jest.mock("aws-cdk-lib/aws-iam", () => ({
  Role: jest.fn(),
  AccountPrincipal: jest.fn(),
  ServicePrincipal: jest.fn().mockImplementation(() => {
    return { assumedBy: 'ecs-tasks.amazonaws.com' };
  }),
  ManagedPolicy: {
    fromAwsManagedPolicyName: jest.fn().mockReturnValue({
      policyName: 'AmazonS3FullAccess',
    }),
  },
}));

jest.mock("aws-cdk-lib/aws-ec2", () => ({
  Vpc: jest.fn(() => ({
    privateSubnets: [{ subnetId: "subnet-123" }],
    publicSubnets: [{ subnetId: "subnet-456" }],
    isolatedSubnets: [{ subnetId: "subnet-789" }],
    vpcId: "vpc-12345",
  })),
}));

jest.mock("aws-cdk-lib/aws-ecs", () => ({
  Cluster: jest.fn(() => ({
    vpc: {
      privateSubnets: [{ subnetId: "subnet-123" }],
      publicSubnets: [{ subnetId: "subnet-456" }],
      isolatedSubnets: [{ subnetId: "subnet-789" }],
      vpcId: "vpc-12345",
    },
  })),
}));

jest.mock("aws-cdk-lib/aws-ecr", () => ({
  Repository: jest.fn(),
}));

describe("SasPlatformStack", () => {
  test("Check the Sas Platform", () => {
    const app = new App();
    const mockVpc = new ec2.Vpc(app, "MockVpc", {});
    const stack = new SasPlatformStack(app, "MyTestStack", {
      env: { account: "123456789012", region: "us-east-1" },
      mode: "test",
      baseId: "test-id",
      awsAccountId: "123456789012",
    });
    let template = Template.fromStack(stack);

    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.resourceCountIs("AWS::ECS::Cluster", 1);
    template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 2);
    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);

    // const ecrStack = new EcrStack(app, "MyTestEcrStack", { mode: "dev" });
    // template = Template.fromStack(ecrStack);
    template.resourceCountIs("AWS::ECR::Repository", 1);

    // const mockCluster = new ecs.Cluster(stack, "MockCluster", { vpc: mockVpc });
    // const mockRepository = new ecr.Repository(stack, "MockRepository");
    // const fargateStack = new ECSFargateStack(stack, "MyTestEcsStack", {
    //   cluster: mockCluster,
    //   repository: mockRepository,
    //   mode: "dev",
    // });
    // template = Template.fromStack(fargateStack);
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);

    // const mockBackendRole = new iam.Role(stack, "MockBackendRole", {
    //   assumedBy: new iam.AccountPrincipal("123456789012"),
    // });
    // const mockFrontendRole = new iam.Role(stack, "MockFrontendRole", {
    //   assumedBy: new iam.AccountPrincipal("123456789012"),
    // });
    // const s3Stack = new S3Stack(app, "MyTestS3Stack", {
    //   backendTaskRole: mockBackendRole,
    //   frontendTaskRole: mockFrontendRole,
    //   mode: "dev",
    // });
    // template = Template.fromStack(s3Stack);
    template.resourceCountIs("AWS::S3::Bucket", 1);

    // const auroraStack = new AuroraStack(app, "MyTestAuroraStack", { vpc: mockVpc, mode: "dev" });
    // template = Template.fromStack(auroraStack);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
  });
});
