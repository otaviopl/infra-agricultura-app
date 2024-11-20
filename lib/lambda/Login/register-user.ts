import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as bcrypt from "bcrypt";

// Inicializar o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
export const handler = async (event: any) => {
  try {
    if (!event.body) {
      console.error("Corpo da requisição está vazio ou não existe.");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Corpo da requisição está vazio." }),
      };
    }

    let body;
    console.log(body)
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      console.error("Erro ao analisar JSON:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Corpo da requisição não é um JSON válido." }),
      };
    }

    const { username, email, password } = body;

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Todos os campos são obrigatórios." }),
      };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parâmetros para inserir no DynamoDB
    const params = {
      TableName: process.env.TABLE_NAME!,
      Item: {
        username: { S: username },
        email: { S: email },
        password: { S: hashedPassword },
      },
    };

    // Inserção no DynamoDB
    await dynamoDbClient.send(new PutItemCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Usuário registrado com sucesso!" }),
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao registrar usuário." }),
    };
  }
};