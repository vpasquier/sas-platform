import { AccountConfig, AWSAccountIds, AWSRegions, EnvType } from "../types";

export const prdConfig: AccountConfig = {
  envName: EnvType.prd,
  oldEnvName: "production",
  awsEnv: {
    account: AWSAccountIds.prd,
    region: AWSRegions.US_EAST_1,
    backupRegion: AWSRegions.US_EAST_2,
    shortHandRegion: "use1",
  },
  domain: "werkdrag.com",
  maxAzs: 2,
  auroraInstanceType: "t3.medium",
  rdsInstanceType: "t3.small",
  workbenchRdsInstanceType: "t3.medium",
  memoryLimitMiB: 1024,
  desiredCount: 2,
  cpu: 512,
  circuitBreaker: {
    rollback: false,
  },
};
