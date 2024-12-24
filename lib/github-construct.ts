import { Duration } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const githubDomain = "token.actions.githubusercontent.com";

export class GithubConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const ghProvider = new iam.OpenIdConnectProvider(this, "githubProvider", {
      url: `https://${githubDomain}`,
      clientIds: ["sts.amazonaws.com"],
    });

    const repositoryConfig = [
      { owner: "vpasquier", repo: "sas-backend-django" },
      { owner: "vpasquier", repo: "sas-platform" },
      { owner: "vpasquier", repo: "sas-frontend" },
    ];

    const iamRepoDeployAccess = repositoryConfig.map((r) => `repo:${r.owner}/${r.repo}:*`);

    const conditions: iam.Conditions = {
      StringEquals: {
        [`${githubDomain}:aud`]: "sts.amazonaws.com",
      },
      "ForAnyValue:StringLike": {
        [`${githubDomain}:sub`]: iamRepoDeployAccess,
      },
    };

    const deployRole = new iam.Role(scope, "ecrDeployGitHubProviderRole", {
      assumedBy: new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions),
      roleName: "ecr-deploy-github-action",
      description: "This role is used via GitHub Actions to deploy versioned images to ECR.",
      maxSessionDuration: Duration.hours(1),
    });

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:GetAuthorizationToken",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchDeleteImage",
          "ecs:UpdateService",
        ],
        resources: ["*"],
      })
    );
  }
}
