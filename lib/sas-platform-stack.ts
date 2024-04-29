import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

interface SasPlatformStackProps extends cdk.StackProps {
  env: cdk.Environment;
  mode: string;
  githubInfo: {
    gitOwner: string;
    gitRepository: string;
    branch: string;
  };
  fargateService: ecs.IBaseService;
  djangoRepository: ecr.IRepository;
  djangoContainerName: string;
  connectionARN: string;
}

export class SasPlatformStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SasPlatformStackProps) {
    super(scope, id, props);

    const gitHubSource = codebuild.Source.gitHub({
      owner: props.githubInfo.gitOwner,
      repo: props.githubInfo.gitRepository,
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.githubInfo.branch),
      ],
    });

    const codebuildRole = new iam.Role(this, "CodeBuildRole", {
      roleName: id + "-codebuild-role",
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("codebuild.amazonaws.com"),
        new iam.ServicePrincipal("codepipeline.amazonaws.com")
      ),
    });

    codebuildRole.addToPolicy(new iam.PolicyStatement({ resources: ["*"], actions: ["ecr:*"] }));

    const djangoCodebuildProject = new codebuild.Project(this, id + "django-build-project", {
      projectName: id + "django-codebuild-project",
      role: codebuildRole,
      source: gitHubSource,
      badge: true,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
        privileged: true,
      },
      environmentVariables: {
        ECR_DJANGO_REPO_URI: {
          value: `${props.djangoRepository.repositoryUri}`,
        },
        DJANGO_CONTAINER_NAME: {
          value: `${props.djangoContainerName}`,
        },
        AWS_ACCOUNT_ID: {
          value: `${props.awsAccountId}`,
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename(`buildspec.yml`),
    });
    const sourceOutput = new codepipeline.Artifact();
    const djangoBuildOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: "GitHub_Source",
      owner: props.githubInfo.gitOwner,
      repo: props.githubInfo.gitRepository,
      branch: props.githubInfo.branch,
      output: sourceOutput,
      connectionArn: props.connectionARN,
    });

    const djangoBuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "DjangoCodeBuildAction",
      project: djangoCodebuildProject,
      input: sourceOutput,
      outputs: [djangoBuildOutput],
    });

    // optional choice. You can replace it which your desired action
    const djangoManualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: "DjangoDeployApprove",
    });

    const djangoDeployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "DjangoDeployAction",
      service: props.fargateService,
      imageFile: new codepipeline.ArtifactPath(djangoBuildOutput, `imagedefinitions.json`),
    });

    //// ***PIPELINE STAGES***
    new codepipeline.Pipeline(this, id + "-django-pipeline", {
      pipelineName: id + "-django-pipeline",
      stages: [
        {
          stageName: "Django-Source",
          actions: [sourceAction],
        },
        {
          stageName: "Django-Approve",
          actions: [djangoManualApprovalAction],
        },
        {
          stageName: "Django-Build",
          actions: [djangoBuildAction],
        },
        {
          stageName: "Django-Deploy-to-ECS",
          actions: [djangoDeployAction],
        },
      ],
    });
  }
}
