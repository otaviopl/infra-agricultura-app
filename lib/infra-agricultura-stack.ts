import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './nested/api-stack';
import { DynamoStack } from './nested/dynamo-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraAgriculturaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const dynamoStack = new DynamoStack(this, 'DynamoStack');

    new ApiStack(this, 'ApiStack', {
      dynamoTable: dynamoStack.table,
    });

  }
}
