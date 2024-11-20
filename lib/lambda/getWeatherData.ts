import { APIGatewayEvent } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();

exports.handler = async (event: APIGatewayEvent) => {
  try {
    // Verifica se o body foi enviado
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Body é obrigatório" }),
      };
    }

    // Parse do body enviado pelo front-end
    const { latitude, longitude } = JSON.parse(event.body);

    // Verifica se latitude e longitude foram enviados
    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Latitude e longitude são obrigatórios" }),
      };
    }

    // Buscar a chave da API no SSM
    const parameter = await ssmClient.send(
      new GetParameterCommand({
        Name: 'weather-api',
        WithDecryption: true,
      })
    );
    const OPEN_WEATHER_API_KEY = parameter.Parameter?.Value;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric`;

    // Requisição à API OpenWeather usando fetch
    const response = await fetch(weatherUrl);

    // Verifica se a resposta é bem-sucedida
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Erro na API OpenWeather: ${response.statusText}` }),
      };
    }

    // Parse dos dados retornados
    const data = await response.json();

    // Estruturação dos dados para o front-end
    const weatherData = {
      location: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      weather: data.weather[0].description,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify(weatherData),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erro ao buscar dados climáticos:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro interno no servidor' }),
      };
    } else {
      console.error('Erro desconhecido ao buscar dados climáticos:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro desconhecido no servidor' }),
      };
    }
  }
};
