import { AccountConfig, AWSAccountIds, AWSRegions, EnvType } from "../types";

export const devConfig: AccountConfig = {
  envName: EnvType.dev,
  oldEnvName: "dev",
  awsEnv: {
    account: AWSAccountIds.dev,
    region: AWSRegions.US_EAST_1,
    backupRegion: AWSRegions.US_EAST_2,
    shortHandRegion: "use1",
  },
  domain: "dev.werkdrag.com",
  maxAzs: 2,
  auroraInstanceType: "t3.medium",
  rdsInstanceType: "t3.small",
  workbenchRdsInstanceType: "t3.medium",
  memoryLimitMiB: 1024,
  desiredCount: 1,
  cpu: 512,
  circuitBreaker: {
    rollback: true,
  },
};
