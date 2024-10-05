// import * as cdk from "aws-cdk-lib";
// import * as SasPlatform from "../lib/sas-platform-stack";

// import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecr from "aws-cdk-lib/aws-ecr";

// import { Connections } from "aws-cdk-lib/aws-ec2";  // Ensure you import the correct class

// // Mock Fargate Service with updated connections
// const mockFargateService: ecs.FargateService = {
//   serviceName: "MockFargateServiceName",
//   taskDefinition: jest.fn() as any,
//   node: jest.fn() as any,
//   stack: jest.fn() as any,
//   env: jest.fn() as any,
//   serviceArn: "arn:aws:ecs:us-east-1:123456789012:service/mock-service",
//   metric: jest.fn() as any,
//   applyRemovalPolicy: jest.fn(),
//   configureAwsVpcNetworkingWithSecurityGroups: jest.fn(),

//   // Updated connections mock
//   connections: {
//     allowFrom: jest.fn(),
//     allowTo: jest.fn(),
//     securityGroups: [], // Mock an empty array for security groups
//     _securityGroups: [], // Add the required internal property as an empty array
//     _securityGroupRules: [], // Add the required internal property as an empty array
//     addSecurityGroup: jest.fn(), // Mocking addSecurityGroup method
//     removeSecurityGroup: jest.fn(), // Mocking removeSecurityGroup method
//     peer: jest.fn(), // Mocking peer method if it's used
//     defaultPortRange: jest.fn(), // Mock defaultPortRange
//     defaultPort: undefined, // Mock defaultPort if not used
//   } as unknown as Connections,  // Cast it to the Connections type
// };


// // Mock ECR Repository
// const mockECRRepository: ecr.IRepository = {
//   repositoryArn: "MockECRRepositoryArn",
//   repositoryName: "MockECRRepositoryName",
//   repositoryUri: "mockecrrepositoryuri.dkr.ecr.us-east-1.amazonaws.com",
//   env: jest.fn() as any, // Mocking environment
//   stack: jest.fn() as any, // Mocking stack
//   node: jest.fn() as any, // Mocking node
//   addToResourcePolicy: jest.fn() as any, // Mocking addToResourcePolicy
//   addToPrincipalPolicy: jest.fn() as any, // Mocking addToPrincipalPolicy
// };

// test("SaS Platform Stack", () => {
//   const app = new cdk.App();
//   const stack = new SasPlatform.SasPlatformStack(app, "baseId" + "-platform", {
//     env: { region: "us-east-1" }, // Provide your desired AWS region
//     mode: "test", // Example value for mode
//     githubInfo: {
//       gitOwner: "yourGitOwner",
//       gitRepository: "yourGitRepository",
//       branch: "yourBranch",
//     },
//     fargateService: mockFargateService, // Provide a mock Fargate service
//     ecrRepository: mockECRRepository, // Provide a mock ECR repository
//     djangoContainerName: "yourDjangoContainerName",
//     connectionARN: "yourConnectionARN",
//     awsAccountId: "yourAWSAccountId",
//   });

//   // Add assertions here if needed
//   expect(stack).toHaveResourceLike("AWS::CodePipeline::Pipeline", {
//     Properties: {
//       Name: "baseId-django-pipeline",
//     },
//   });

//   // Assert that the pipeline stages are defined correctly
//   expect(stack).toHaveResourceLike("AWS::CodePipeline::Pipeline", {
//     Properties: {
//       Stages: [
//         { Name: "Django-Source" },
//         { Name: "Django-Approve
