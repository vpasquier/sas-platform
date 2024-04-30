import * as cdk from "aws-cdk-lib"
import * as SasPlatform from "../lib/sas-platform-stack"

import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ecr from "aws-cdk-lib/aws-ecr"

// Mock Fargate Service
const mockFargateService: ecs.IBaseService = {
  taskDefinition: jest.fn() as any, // Mocking task definition
  serviceName: "MockFargateServiceName",
  node: jest.fn() as any, // Mocking node
  stack: jest.fn() as any, // Mocking stack
  env: jest.fn() as any, // Mocking environment
}

// Mock ECR Repository
const mockECRRepository: ecr.IRepository = {
  repositoryArn: "MockECRRepositoryArn",
  repositoryName: "MockECRRepositoryName",
  repositoryUri: "mockecrrepositoryuri.dkr.ecr.us-east-1.amazonaws.com",
  env: jest.fn() as any, // Mocking environment
  stack: jest.fn() as any, // Mocking stack
  node: jest.fn() as any, // Mocking node
  addToResourcePolicy: jest.fn() as any, // Mocking addToResourcePolicy
  addToPrincipalPolicy: jest.fn() as any, // Mocking addToPrincipalPolicy
}

test("SaS Platform Stack", () => {
  const app = new cdk.App();
  const stack = new SasPlatform.SasPlatformStack(app, "baseId" + "-platform", {
    env: { region: "us-east-1" }, // Provide your desired AWS region
    mode: "test", // Example value for mode
    githubInfo: {
      gitOwner: "yourGitOwner",
      gitRepository: "yourGitRepository",
      branch: "yourBranch",
    },
    fargateService: mockFargateService, // Provide a mock Fargate service
    djangoRepository: mockECRRepository, // Provide a mock ECR repository
    djangoContainerName: "yourDjangoContainerName",
    connectionARN: "yourConnectionARN",
    awsAccountId: "yourAWSAccountId",
  });
  // Add assertions here if needed
  // Assert the stack has expected resources
  expect(stack).toHaveResourceLike("AWS::CodePipeline::Pipeline", {
    Properties: {
      Name: "baseId-django-pipeline",
    },
  });

  // Assert that the pipeline stages are defined correctly
  expect(stack).toHaveResourceLike("AWS::CodePipeline::Pipeline", {
    Properties: {
      Stages: [
        { Name: "Django-Source" },
        { Name: "Django-Approve" },
        { Name: "Django-Build" },
        { Name: "Django-Deploy-to-ECS" },
      ],
    },
  });

  // Assert that the CodeBuild project is defined with the correct configuration
  expect(stack).toHaveResourceLike("AWS::CodeBuild::Project", {
    Properties: {
      Name: "baseIddjango-codebuild-project",
      Source: {
        Type: "GITHUB",
        Location: "https://github.com/yourGitOwner/yourGitRepository.git",
        BuildSpec: "buildspec.yml",
      },
      Environment: {
        Type: "LINUX_CONTAINER",
        ComputeType: "BUILD_GENERAL1_SMALL",
        Image: "aws/codebuild/amazonlinux2-x86_64-standard:4.0",
        PrivilegedMode: true,
        EnvironmentVariables: [
          {
            Name: "ECR_DJANGO_REPO_URI",
            Value: "mockecrrepositoryuri.dkr.ecr.us-east-1.amazonaws.com",
          },
          {
            Name: "DJANGO_CONTAINER_NAME",
            Value: "yourDjangoContainerName",
          },
          {
            Name: "AWS_ACCOUNT_ID",
            Value: "yourAWSAccountId",
          },
        ],
      },
    },
  });
})
