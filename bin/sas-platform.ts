#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SasPlatformStack } from "../lib/sas-platform-stack";

import "source-map-support/register";
import { loadEnvironmentVariablesFile, configLocalEnvironmentFile as setDotEnvironmentFile } from "../utils/index";

const app = new cdk.App();
const mode = process.env.MODE === "prod" ? "prod" : "dev";
const env = loadEnvironmentVariablesFile(mode);

setDotEnvironmentFile(mode);

const baseId = env.base_id + "-" + mode;

const envUser = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: env.region,
};

new SasPlatformStack(app, baseId + "-platform", {
  env: envUser,
  mode: mode,
  baseId: baseId,
  awsAccountId: env.awsAccountId,
});

app.synth();
