import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: 'us-east-1' });

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Body é obrigatório" }),
      };
    }

    const { latitude, longitude, plantType } = JSON.parse(event.body);

    if (!latitude || !longitude || !plantType) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Latitude, longitude e tipo de planta são obrigatórios" }),
      };
    }

    // Lógica para sugerir períodos de plantio
    // Exemplificando com dados estáticos ou lógica baseada em APIs externas
    // Você pode consultar DynamoDB para obter dados históricos ou utilizar uma API de previsão

    // Exemplo de resposta
    const plantingSuggestions = {
      plantType,
      bestPlantingPeriods: [
        { start: '2024-10-01', end: '2024-11-15' },
        { start: '2025-03-01', end: '2025-04-15' },
      ],
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(plantingSuggestions),
    };
  } catch (error: unknown) {
    console.error('Erro ao sugerir períodos de plantio:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Erro interno no servidor" }),
    };
  }
};
