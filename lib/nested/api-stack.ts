import { Duration, NestedStack, NestedStackProps } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import { DynamoStack } from "./dynamo-stack";

export class APInestedStack extends NestedStack {
  public readonly getWeatherData: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    databaseStack: DynamoStack,
    props?: NestedStackProps
  ) {
    super(scope, id, props);

    const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const usersTable = databaseStack.usersTable;
    
    // ATUALIZAR ARN-LAYER TODA VEZ
    const sharedLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "SharedLayer",
      "arn:aws:lambda:us-east-1:060396677891:layer:nodejs-infra-agro:2"
    );

    // Criação das Lambdas
    const lambdas = createLambdas(usersTable, sharedLayer, this);

    // Configuração do API Gateway
    const api = new apigateway.RestApi(this, "AgrodataByLocation", {
      restApiName: "AgrodataByLocation",
      description: "API que retorna dados climáticos baseados na localização.",
      deployOptions: {
        stageName: "dev",
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Rotas
    const weatherInfo = api.root.addResource("weather-info");
    addLambdaIntegration(weatherInfo, lambdas.getWeatherData);

    const alertsInfo = api.root.addResource("alerts-info");
    alertsInfo.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdas.alertsInfo, {
        proxy: true, // Proxy direto para simplificar o repasse de parâmetros
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": "$input.json('$')", // Retorna o JSON completo da Lambda
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
          {
            statusCode: "400",
            responseTemplates: {
              "application/json": '{"message": "Erro no cliente"}',
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
          {
            statusCode: "500",
            responseTemplates: {
              "application/json": '{"message": "Erro no servidor"}',
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
        ],
      }),
      {
        requestParameters: {
          "method.request.querystring.longitude": true, // Parâmetro obrigatório
          "method.request.querystring.latitude": true,  // Parâmetro obrigatório
          "method.request.querystring.date": true,      // Parâmetro obrigatório
        },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "500",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );    

    // Adicionando a rota /update-location
    const updateLocation = api.root.addResource("update-location");
    addLambdaIntegration(updateLocation, lambdas.putUserLocation);
    
    updateLocation.addMethod(
      "GET",
      new apigateway.LambdaIntegration(lambdas.getLocationByUser, {
        proxy: false,
        requestTemplates: {
          "application/json": JSON.stringify({
            queryStringParameters: {
              username: "$input.params('username')",
            },
          }),
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": "$input.json('$')",
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
          {
            statusCode: "400",
            responseTemplates: {
              "application/json": '{"message": "Erro no cliente"}',
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
          {
            statusCode: "500",
            responseTemplates: {
              "application/json": '{"message": "Erro no servidor"}',
            },
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
          },
        ],
      }),
      {
        requestParameters: {
          "method.request.querystring.username": true, // Define o parâmetro 'username' como obrigatório
        },
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "500",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );    

    const userRegistration = api.root.addResource("register");
    addLambdaIntegration(userRegistration, lambdas.registerUser);

    const userLogin = api.root.addResource("login");
    addLambdaIntegration(userLogin, lambdas.loginUser);

    // Expondo as Lambdas para uso externo
    this.getWeatherData = lambdas.getWeatherData;
  }
}

// Função auxiliar para integrar Lambdas a rotas do API Gateway
const addLambdaIntegration = (
  resource: apigateway.Resource,
  lambdaFunction: lambda.Function,
  method: string = "POST" // Define POST como padrão
) => {
  resource.addMethod(
    method,
    new apigateway.LambdaIntegration(lambdaFunction, {
      proxy: false,
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": "$input.json('$')",
          },
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": "'*'",
          },
        },
        {
          statusCode: "400",
          responseTemplates: {
            "application/json": '{"message": "Erro no cliente"}',
          },
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": "'*'",
          },
        },
        {
          statusCode: "500",
          responseTemplates: {
            "application/json": '{"message": "Erro no servidor"}',
          },
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": "'*'",
          },
        },
      ],
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
        {
          statusCode: "400",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
        {
          statusCode: "500",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
};

const createLambdas = (
  usersTable: dynamodb.Table,
  sharedLayer: lambda.ILayerVersion,
  scope: Construct
) => {
  // Role com permissões detalhadas
  const lambdaRole = new iam.Role(scope, "LambdaExecutionRole", {
    assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
    ],
  });

  // Adiciona políticas customizadas para a Role
  lambdaRole.addToPolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query"],
      resources: [usersTable.tableArn],
    })
  );

  // Permissão para acessar o parâmetro específico no SSM Parameter Store
  lambdaRole.addToPolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ssm:GetParameter", "ssm:GetParameters"],
      resources: ["arn:aws:ssm:us-east-1:060396677891:parameter/weather-api","arn:aws:ssm:us-east-1:060396677891:parameter/embrapa-api/token"]
    })
  );

  // Lambda para obter dados climáticos
  const getWeatherData = new lambda.Function(scope, "GetWeatherData", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "getWeatherData.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });

  const alertsInfo = new lambda.Function(scope, "alertData", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "get-alerts-infos.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });


  // Lambda para registrar usuários
  const registerUser = new lambda.Function(scope, "RegisterUser", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "register-user.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/Login")),
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });

  // Lambda para salvar localização do usuário
  const putUserLocation = new lambda.Function(scope, "PutUserLocation", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "put-userLoc-dynamo.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    initialPolicy: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
        ],
        resources: [usersTable.tableArn],
      }),
    ],
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });

  const getLocationByUser = new lambda.Function(scope, "GetLocByUser", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "get-userLoc-dynamo.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    initialPolicy: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
        ],
        resources: [usersTable.tableArn],
      }),
    ],
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });

  // Lambda para login de usuários
  const loginUser = new lambda.Function(scope, "LoginUser", {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: "login-user.handler",
    code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/Login")),
    environment: {
      TABLE_NAME: usersTable.tableName,
    },
    timeout: Duration.seconds(15),
    memorySize: 256,
    logRetention: logs.RetentionDays.ONE_WEEK,
    role: lambdaRole,
    layers: [sharedLayer],
  });

  return { getWeatherData, registerUser, loginUser, putUserLocation, getLocationByUser, alertsInfo};
};
