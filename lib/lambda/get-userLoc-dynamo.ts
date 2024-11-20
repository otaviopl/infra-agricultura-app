import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

// Configuração do cliente DynamoDB
const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event: any) => {
  try {
    // Extraindo 'username' dos query parameters
    const username = event.queryStringParameters?.username;

    if (!username) {
      return respond(400, "O parâmetro 'username' é obrigatório.");
    }

    // Buscar localização no DynamoDB
    const location = await getUserLocation(username);

    if (!location) {
      return respond(404, `Nenhuma localização encontrada para o username: ${username}`);
    }

    return respond(200, { message: "Localização encontrada.", location });
  } catch (error) {
    console.error("Erro:", error);
    return respond(500, "Erro interno ao buscar a localização.");
  }
};

// Busca a localização do usuário no DynamoDB
async function getUserLocation(username: string) {
  const params = {
    TableName: process.env.TABLE_NAME!,
    Key: { username: { S: username } },
    ProjectionExpression: "address, latitude, longitude",
  };

  const command = new GetItemCommand(params);
  const response = await dynamoDb.send(command);

  // Verifica e retorna os dados em formato estruturado
  if (response.Item) {
    return {
      address: response.Item.address?.S || null,
      latitude: response.Item.latitude?.N ? parseFloat(response.Item.latitude.N) : null,
      longitude: response.Item.longitude?.N ? parseFloat(response.Item.longitude.N) : null,
    };
  }

  return null;
}

// Construção de respostas HTTP
function respond(statusCode: number, message: any) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: typeof message === "string" ? JSON.stringify({ message }) : JSON.stringify(message),
  };
}