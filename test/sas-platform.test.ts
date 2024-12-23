import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { SasPlatformStack } from "../lib/sas-platform-stack";

describe("SasPlatformStack", () => {
  test("Sas Platform Tests", () => {
    const app = new App();
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
    template.resourceCountIs("AWS::ECR::Repository", 1);
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.resourceCountIs("AWS::Cognito::UserPool", 1);
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
  });
});
