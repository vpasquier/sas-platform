#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SasPlatformStack } from "../lib/sas-platform-stack";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

import "source-map-support/register";
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

// Create a VPC
const vpc = new ec2.Vpc(this, "MyVpc", {
  maxAzs: 2,
});

// Create an ECS cluster within the VPC
const cluster = new ecs.Cluster(this, "MyCluster", {
  vpc,
});

const ecs_stack_backend = new ECSFargateStack(app, baseId + "-ecs", {
  vpc,
  cluster,
  env: envUser,
  mode: mode,
  serviceARN: `arn:aws:ecs:${env.region}:${env.awsAccountId}:service/${env.base_id}-backend`,
});

const ecs_stack_frontend = new ECSFargateStack(app, baseId + "-ecs", {
  vpc,
  cluster,
  env: envUser,
  mode: mode,
  serviceARN: `arn:aws:ecs:${env.region}:${env.awsAccountId}:service/${env.base_id}-front`,
});

const ecr_stack = new EcrStack(app, baseId + "-ecr", {
  env: envUser,
  mode: mode,
});

new SasPlatformStack(app, baseId + "-platform", {
  env: envUser,
  mode: mode,
  fargateBackEndService: ecs_stack_backend.fargateService,
  fargateFrontEndService: ecs_stack_backend.fargateService,
  ecrRepository: ecr_stack.repository,
  awsAccountId: env.awsAccountId,
});

app.synth();
