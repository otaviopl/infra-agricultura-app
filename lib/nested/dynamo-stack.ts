import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NestedStack, NestedStackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DynamoStack extends NestedStack {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // Criação da tabela DynamoDB
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
