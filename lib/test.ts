import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

export class SasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define S3 Bucket for CloudFront
    const bucket = new s3.Bucket(this, "SasPrivateBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Define Lambda Function for Lambda@Edge
    const edgeLambda = new lambda.Function(this, "SasLambdaEdgeAuth", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda-edge-auth"),
    });

    // **Create a version of the Lambda function**
    const edgeLambdaVersion = edgeLambda.currentVersion

    // Define CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, "SasDistribution", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              lambdaFunctionAssociations: [
                {
                  eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
                  // **Use the Lambda Version here**
                  lambdaFunction: edgeLambdaVersion,
                },
              ],
            },
          ],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        acm.Certificate.fromCertificateArn(this, "Certificate", "YOUR_CERTIFICATE_ARN_HERE"),
        {
          aliases: ["drag-me.com"],
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          sslMethod: cloudfront.SSLMethod.SNI,
        }
      ),
    });
  }
}
