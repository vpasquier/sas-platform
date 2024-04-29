#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SasPlatformStack } from "../lib/sas-platform-stack";

import "source-map-support/register";
import { CICDStack } from "../lib/cicd_stack";
import { loadEnvironmentVariablesFile, configLocalEnvironmentFile as setDotEnvironmentFile } from "../utils/index";
import { ECSFargateStack } from "../lib/ecs_stack";
import { EcrStack } from "../lib/ecr_stack";

const app = new cdk.App();
const mode = process.env.MODE === "prod" ? "prod" : "dev";
const env = loadEnvironmentVariablesFile(mode);

setDotEnvironmentFile(mode);

const baseId = env.base_id + "-" + mode;

const envUser = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: env.region,
};

const githubInfo = {
  gitOwner: env.githubInfo.owner,
  gitRepository: env.githubInfo.repo,
  branch: env.githubInfo.branch,
};

const ecs_stack = new ECSFargateStack(app, baseId + "-ecs", {
  env: envUser,
  mode: mode,
  serviceARN: env.serviceARN,
});

const ecr_stack = new EcrStack(app, baseId + "-ecr", {
  env: envUser,
  mode: mode,
  django_ecr_name: env.ecrInfo.django_repo_name,
});

new SasPlatformStack(app, baseId + "-cicd", {
  env: envUser,
  mode: mode,
  githubInfo: githubInfo,
  fargateService: ecs_stack.fargateService,
  djangoRepository: ecr_stack.djangoRepository,
  djangoContainerName: env.ecrInfo.django_repo_name,
  connectionARN: env.connectionARN,
  awsAccountId: env.awsAccountId,
});

app.synth();
