export enum AWSAccountIds {
  dev = "952219337142",
  prd = "735254248579",
}

export interface AccountConfig {
  envName: EnvType;
  oldEnvName: "dev" | "production";
  awsEnv: {
    account: string;
    region: AWSRegions;
    backupRegion: AWSRegions;
    shortHandRegion: ShortHandAWSRegions;
  };
  maxAzs: 2 | 3 | 4 | 5 | 6 | 7;
  domain: string;
  rdsInstanceType: string;
  workbenchRdsInstanceType: string;
  auroraInstanceType: string;
  memoryLimitMiB: number;
  desiredCount: number;
  cpu: number;
  circuitBreaker: {
    rollback: boolean;
  };
}

export enum TenantName {
  sandbox = "sandbox",
  pilot = "pilot",
}

export enum EnvType {
  dev = "dev",
  prd = "prd",
}
// we can expand this as needed
export enum AWSRegions {
  US_EAST_1 = "us-east-1",
  US_EAST_2 = "us-east-2",
  US_WEST_1 = "us-west-1",
  US_WEST_2 = "us-west-2",
}

export type ShortHandAWSRegions = "use1" | "use2" | "usw1" | "usw2";

export interface mergedConfig extends AccountConfig {}

export const commonEcrArnPrefix = `arn:aws:ecr:${AWSRegions.US_EAST_1}:${AWSAccountIds.dev}:repository`;
