import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as fs from "fs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface CognitoApiConstructProps {
  apiName: string;
  hostedZone: route53.PublicHostedZone;
  openApiSpecPath: string;
  backendUrl: string;
  vpc: ec2.Vpc;
}

export class CognitoApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: CognitoApiConstructProps) {
    super(scope, id);

    const { apiName, hostedZone, openApiSpecPath, backendUrl, vpc } = props;

    // Read OpenAPI specification
    const apiSpec = fs.readFileSync(openApiSpecPath, "utf-8");

    // Create a Cognito User Pool
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${apiName}UserPool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    // Create a Lambda function for the authorizer
    const authorizerFunction = new lambda.Function(this, "AuthorizerFunction", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: "lambda/authorizer.handler",
      code: lambda.Code.fromAsset("lambda"),
    });

    // Create an API Gateway using the Swagger/OpenAPI specification
    this.api = new apigateway.SpecRestApi(this, "ApiGateway", {
      restApiName: `${apiName} API`,
      description: `API for ${apiName}`,
      apiDefinition: apigateway.ApiDefinition.fromInline(JSON.parse(apiSpec)),
    });

    // Create a Lambda authorizer
    const authorizer = new apigateway.RequestAuthorizer(this, "LambdaAuthorizer", {
      handler: authorizerFunction,
      identitySources: [apigateway.IdentitySource.header("Authorization")],
    });

    // Create a VPC Link for private integration
    const vpcLink = new apigateway.VpcLink(this, "VpcLink", {
      vpc,
      targets: [], // Leave empty if your Fargate service uses a Network Load Balancer (NLB)
    });

    // Example of adding a specific method if you need a custom endpoint integration
    const resource = this.api.root.addResource("werkdrag");
    resource.addMethod("GET", new apigateway.HttpIntegration(backendUrl, {
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink,
      },
    }), {
      authorizer,
    });

    const domainNameLabel = "api.werkdrag.com";

    // Create the certificate for custom domain
    const certificate = new acm.Certificate(this, "ApiCertificate", {
      domainName: domainNameLabel,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create the Domain Name in API Gateway
    new apigateway.DomainName(this, "ApiDomainName", {
      domainName: domainNameLabel,
      certificate: certificate,
    });

    // Associate the custom domain with the API
    this.api.addDomainName("CustomDomain", {
      domainName: domainNameLabel,
      certificate: certificate,
    });
  }
}
