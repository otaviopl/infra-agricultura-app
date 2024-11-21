import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();
const CHATGPT_API_URL = "https://api.openai.com/v1/chat/completions";

interface UserConditions {
  tmax2m: number;
  tmin2m: number;
  apcpsfc: number;
  gustsfc: number;
  rh2m: number;
  sunsdsfc: number;
  soill0_10cm: number;
}

export const handler = async (event: any) => {
  try {
    const parameter = await ssmClient.send(
        new GetParameterCommand({
          Name: '/chatGpt/key',
          WithDecryption: true,
        })
      );

    const CHATGPT_API_KEY = parameter.Parameter?.Value;
    if (!CHATGPT_API_KEY) {
      throw new Error("API key not found in SSM Parameter Store");
    }

    const body: UserConditions = JSON.parse(event.body);

    const prompt = `
      Dadas as condições:
      - Temperatura máxima: ${body.tmax2m}°C
      - Temperatura mínima: ${body.tmin2m}°C
      - Precipitação acumulada: ${body.apcpsfc} mm
      - Velocidade do vento: ${body.gustsfc} m/s
      - Umidade relativa: ${body.rh2m}%
      - Radiação solar: ${body.sunsdsfc} W/m²
      - Umidade do solo: ${body.soill0_10cm}%

      Gere uma interpretação amigável para agricultores sobre como essas condições afetam o plantio.
    `;

    const headers = {
      Authorization: `Bearer ${CHATGPT_API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(CHATGPT_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Você é um assistente agrícola. Com base nos meus dados de clima, quero detalhes sobre como plantar melhor." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        interpretation: data.choices[0].message.content,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};