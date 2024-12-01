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
  console.log("Lambda iniciou com o evento:", event); // Loga o evento recebido

  try {
    console.log("Iniciando recuperação da chave do SSM...");
    const parameter = await ssmClient.send(
      new GetParameterCommand({
        Name: "/chatGpt/key",
        WithDecryption: true,
      })
    );

    console.log("Chave recuperada do SSM.");
    const CHATGPT_API_KEY = parameter.Parameter?.Value;
    if (!CHATGPT_API_KEY) {
      console.error("API key não encontrada no SSM Parameter Store.");
      throw new Error("API key not found in SSM Parameter Store");
    }

    const body = JSON.parse(event.body);
    console.log("Payload recebido:", body);

    // Extrair os valores de cada alerta do payload
    const alerts = body.alerts;
    const tmax2m = alerts.tmax2m.valor;
    const tmin2m = alerts.tmin2m.valor;
    const apcpsfc = alerts.apcpsfc.valor;
    const gustsfc = alerts.gustsfc.valor;
    const rh2m = alerts.rh2m.valor;
    const sunsdsfc = alerts.sunsdsfc.valor;
    const soill0_10cm = alerts.soill0_10cm.valor;

    const culturesList = body.cultures
      .map(
        (culture: any) =>
          `- Nome: ${culture.nome}, Safra: ${culture.safra}, Cultivo: ${culture.cultivo}`
      )
      .join("\n");

    console.log("Lista de culturas formatada:", culturesList);

    const prompt = `
    Dadas as condições climáticas fornecidas:
    - Temperatura máxima: ${tmax2m}°C
    - Temperatura mínima: ${tmin2m}°C
    - Precipitação acumulada: ${apcpsfc} mm
    - Velocidade do vento: ${gustsfc} m/s
    - Umidade relativa: ${rh2m}%
    - Radiação solar: ${sunsdsfc} W/m²
    - Umidade do solo: ${soill0_10cm}%

    E as seguintes culturas disponíveis:
    ${culturesList}

    Por favor, forneça uma interpretação amigável para agricultores sobre como essas condições afetam o plantio e sugira quais dessas culturas seriam mais adequadas para plantar sob essas condições. Imagine que os agricultores vão usar suas dicas para plantar, e otimizar os processos deles! Use sua capaciade como IA para determinar previsões com base nos dados.
    `;

    console.log("Prompt para o ChatGPT:", prompt);

    const response = await fetch(CHATGPT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHATGPT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente agrícola. Com base nos meus dados de clima, quero detalhes sobre como plantar melhor. Além disso seria interessante dicas detalhadas para eu ser um melhor agricultor.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Erro na resposta da API:", await response.text());
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API ChatGPT:", data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        interpretation: data.choices[0].message.content,
      }),
    };
  } catch (error: any) {
    console.error("Erro durante a execução da Lambda:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

