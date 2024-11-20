import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as bcrypt from "bcrypt";

// Inicializar o cliente DynamoDB
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const { username, email, password } = JSON.parse(event.body);

    // Validação de campos obrigatórios
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
