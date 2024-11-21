import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();

// Lista de variáveis importantes
const VARIABLES = [
  "tmax2m",
  "tmin2m",
  "apcpsfc",
  "gustsfc",
  "rh2m",
  "sunsdsfc",
  "soill0_10cm",
];

// Base URL da API
const BASE_URL = "https://api.cnptia.embrapa.br/climapi/v1/ncep-gfs";

// Handler principal
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parsear os parâmetros
    const queryParams = event.queryStringParameters;
    if (!queryParams || !queryParams.longitude || !queryParams.latitude || !queryParams.date) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({
          error: "Missing required parameters: longitude, latitude, and date are required.",
        }),
      };
    }

    // Buscar a chave da API no SSM
    const parameter = await ssmClient.send(
      new GetParameterCommand({
        Name: '/embrapa-api/token',
        WithDecryption: true,
      })
    );
    const API_TOKEN = parameter.Parameter?.Value;

    if (!API_TOKEN) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({
          error: "API token not found in SSM parameter store.",
        }),
      };
    }

    const { longitude, latitude, date } = queryParams;

    // Obter os dados para cada variável
    const results: Record<string, any> = {};
    await Promise.all(
      VARIABLES.map(async (variable) => {
        try {
          const url = `${BASE_URL}/${variable}/${date}/${longitude}/${latitude}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${API_TOKEN}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = await response.json();
          results[variable] = data;
        } catch (error: any) {
          results[variable] = {
            error: error.message || "Unknown error",
          };
        }
      })
    );

    // Retornar os resultados consolidados
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify(results),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({
        error: error.message || "An unexpected error occurred.",
      }),
    };
  }
};
