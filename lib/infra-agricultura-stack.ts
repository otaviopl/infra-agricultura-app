import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { APInestedStack } from './nested/api-stack';
import { DynamoStack } from './nested/dynamo-stack';

export class InfraAgriculturaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Criação da stack DynamoDB
    const dynamoStack = new DynamoStack(this, 'DynamoStack');

    // Criação da API Stack e passagem da tabela do DynamoDB
    const apiNested = new APInestedStack(this,'APINestedStack', dynamoStack)      
  }
}
