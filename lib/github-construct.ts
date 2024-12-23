import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class GithubConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create the IAM role for ECR deployment
    const ecrDeployRole = new iam.Role(this, "ECRDeployGitHubActionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "ecr-deploy-github-action",
    });

    // Attach policies to the role
    ecrDeployRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryFullAccess"));
    ecrDeployRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"));

    // Optionally, you can add inline policies for more granular permissions
    ecrDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"],
        resources: [`arn:aws:ecr:us-east-1:503561419437:repository/sas_backend`],
      })
    );
  }
}
