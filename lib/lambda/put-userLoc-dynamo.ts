import { DynamoDBClient, UpdateItemCommand, ReturnValue } from "@aws-sdk/client-dynamodb";

// Configuração do cliente DynamoDB
const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

// Handler principal
export const handler = async (event: any) => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  try {
    // Acessando o corpo da requisição diretamente como objeto JSON
    const { username, location } = event;

    // Validação dos campos obrigatórios
    if (!username || !location || !location.address || !location.latitude || !location.longitude) {
      return buildResponse(400, {
        message: "Campos obrigatórios ausentes. É necessário enviar username e o objeto location com address, latitude e longitude.",
      });
    }

    // Atualizando os atributos no DynamoDB
    const result = await updateUserLocationInDynamoDB(username, location);

    // Retorno de sucesso
    return buildResponse(200, {
      message: "Localização atualizada com sucesso no DynamoDB.",
      updatedAttributes: result.Attributes,
    });
  } catch (error) {
    console.error("Erro ao processar a solicitação:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return buildResponse(500, {
      message: "Erro interno ao atualizar a localização.",
      error: errorMessage,
    });
  }
};

// Função para atualizar a localização no DynamoDB
async function updateUserLocationInDynamoDB(username: string, location: { address: string; latitude: number; longitude: number }) {
  const params = {
    TableName: process.env.TABLE_NAME!, // Nome da tabela do DynamoDB
    Key: { username: { S: username } }, // Chave primária
    UpdateExpression: "SET address = :address, latitude = :latitude, longitude = :longitude",
    ExpressionAttributeValues: {
      ":address": { S: location.address },
      ":latitude": { N: location.latitude.toString() },
      ":longitude": { N: location.longitude.toString() },
    },
    ReturnValues: ReturnValue.UPDATED_NEW, // Retorna apenas os atributos atualizados
  };

  console.log("Parâmetros do DynamoDB:", JSON.stringify(params, null, 2));

  const command = new UpdateItemCommand(params);
  return await dynamoDb.send(command);
}

// Função para construir uma resposta HTTP
function buildResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}
