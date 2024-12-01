import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import fetch from "node-fetch";

const CULTURES_API_URL = "https://api.cnptia.embrapa.br/agritec/v2/culturas";
const ssmClient = new SSMClient();
export const handler = async () => {
    try {
        console.log("Fetching token from SSM...");
        const parameter = await ssmClient.send(
            new GetParameterCommand({
                Name: '/embrapa-api/token',
                WithDecryption: true,
            })
        );

        const token = parameter.Parameter?.Value;
        if (!token) {
            console.error("Token not found in SSM Parameter Store");
            throw new Error("Token not found in SSM Parameter Store");
        }

        console.log("Token retrieved successfully:", token);

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        console.log("Making request to Embrapa API...");
        const response = await fetch(CULTURES_API_URL, { method: "GET", headers });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error("Embrapa API Error:", response.status, response.statusText, errorDetails);
            throw new Error(`API error: ${response.status} - ${response.statusText}. Details: ${errorDetails}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        const compatibleCultures = data.data
            .filter((culture: any) => culture.hasZoneamento)
            .map((culture: any) => ({
                id: culture.id,
                nome: culture.nome,
                safra: culture.safra,
                cultivo: culture.cultivo,
            }));

        console.log("Filtered Cultures:", compatibleCultures);

        return {
            statusCode: 200,
            body: JSON.stringify({ cultures: compatibleCultures }),
        };
    } catch (error: any) {
        console.error("Error occurred:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
