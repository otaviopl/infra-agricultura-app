import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import * as bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const JWT_SECRET = process.env.JWT_SECRET || "seu-segredo-super-seguro";

export const handler = async (event: any) => {
  try {
    const { username, password } = JSON.parse(event.body);

    // Validação de entrada
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Username e senha são obrigatórios." }),
      };
    }

    // Busca o usuário no DynamoDB
    const params = {
      TableName: process.env.TABLE_NAME!,
      Key: {
        username: { S: username }, // O atributo chave precisa estar no formato AttributeValue
      },
    };

    const result = await dynamoDbClient.send(new GetItemCommand(params));
    const user = result.Item;

    // Verifica se o usuário existe
    if (!user || !user.password || typeof user.password.S !== "string") {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Credenciais inválidas." }),
      };
    }

    // Acessa a senha armazenada
    const storedPassword = user.password.S;

    // Valida a senha
    const isPasswordValid = await bcrypt.compare(password, storedPassword);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({ message: "Credenciais inválidas." }),
      };
    }

    // Gera o token JWT
    const token = sign(
      { username: user.username.S, email: user.email.S },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Erro ao realizar login." }),
    };
  }
};
