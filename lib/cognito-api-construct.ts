import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface CognitoApiConstructProps {
  apiName: string;
  hostedZone: route53.PublicHostedZone;
}

export class CognitoApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: CognitoApiConstructProps) {
    super(scope, id);

    const { apiName, hostedZone } = props;

    // Create a Cognito User Pool
    new cognito.UserPool(this, "UserPool", {
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

    // Create an API Gateway
    this.api = new apigateway.RestApi(this, "ApiGateway", {
      restApiName: `${apiName} API`,
      description: `API for ${apiName}`,
    });

    // Create a Lambda authorizer
    const authorizer = new apigateway.RequestAuthorizer(this, "LambdaAuthorizer", {
      handler: authorizerFunction,
      identitySources: [apigateway.IdentitySource.header("Authorization")],
    });

    // Add a resource and method to the API Gateway with the authorizer
    const resource = this.api.root.addResource("example");
    resource.addMethod("GET", new apigateway.MockIntegration(), {
      authorizer: authorizer,
    });

    const domainNameLabel = "api.werkdrag.com";

    // Create the certificate once
    const certificate = new acm.Certificate(this, "ApiCertificate", {
      domainName: domainNameLabel,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Create the Domain Name
    new apigateway.DomainName(this, "ApiDomainName", {
      domainName: domainNameLabel,
      certificate: certificate, // Use the existing certificate
    });

    // Associate the custom domain with the API
    this.api.addDomainName("CustomDomain", {
      domainName: domainNameLabel, // Use the DomainName label
      certificate: certificate, // Reuse the existing certificate
    });
  }
}
