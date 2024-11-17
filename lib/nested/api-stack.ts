import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface ApiStackProps extends cdk.NestedStackProps {
  dynamoTable: dynamodb.Table;
}

export class ApiStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Função Lambda
    const myLambda = new lambda.Function(this, 'MyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: props.dynamoTable.tableName,
      },
    });
    props.dynamoTable.grantReadWriteData(myLambda);

    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'dadosByLocationAPI',
    });

    // Endpoint Lambda integrado
    const lambdaIntegration = new apigateway.LambdaIntegration(myLambda);
    api.root.addResource('items').addMethod('GET', lambdaIntegration);
  }
}
