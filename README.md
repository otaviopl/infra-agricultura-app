# 🛠️ **Infraestrutura do Agora Data**

---

## 🌐 **Visão Geral**
O **Agro Data** oferece uma experiência completa e inteligente para agricultores amadores, combinando dados climáticos detalhados e sugestões de cultivo geradas por IA. A infraestrutura, hospedada na AWS, permite ao usuário inserir sua localização, consultar dados de APIs externas (como da Embrapa) e até mesmo gerar resumos inteligentes com o auxílio do GPT.

---

## 🧱 **Componentes Principais**
1. **Autenticação do Usuário**:
   - Gerenciada por **API Gateway** e **AWS Lambda**.
   - Tokens JWT asseguram autenticação segura e autorização para acesso às funcionalidades.

2. **Gerenciamento de Localização**:
   - O usuário insere sua localização, que é validada e armazenada no DynamoDB.

3. **Consulta de Dados Climáticos**:
   - Integração com as APIs públicas da **Embrapa** para obter dados precisos.
   - Dados processados por Lambdas antes de serem enviados ao usuário.

4. **Resumos Inteligentes com GPT**:
   - Usuário pode solicitar um resumo gerado com base nos dados climáticos obtidos.
   - Uma Lambda envia os dados para a API do GPT, recebe o resumo e entrega ao usuário.

5. **Entrega de Resultados**:
   - Dados e resumos são retornados por meio de **API Gateway** em um formato claro e acessível.

---

## 🔧 **Arquitetura**
1. **Front-End**:
   - Desenvolvido para interagir com o back-end via API Gateway.
   - Permite login, preenchimento de localização, visualização de dados climáticos e solicitação de resumos.

2. **Back-End**:
   - **API Gateway**: Ponto de entrada para todas as requisições.
   - **Lambda Functions**:
     - Gerenciam autenticação, validação de localização e consulta a APIs externas.
     - Processam os dados climáticos e geram resumos inteligentes.
   - **DynamoDB**:
     - Armazena informações do usuário, histórico de consultas e preferências.
   - **GPT Integration**:
     - Uma Lambda dedicada envia requisições à API GPT para gerar resumos a partir dos dados climáticos processados.

3. **Integração com APIs Externas**:
   - **APIs da Embrapa**: Fonte de dados climáticos confiável.
   - **GPT API**: Utilizada para criar resumos personalizados e inteligíveis.

---

## 🛡️ **Segurança**
- **Autenticação e Autorização**:
  - Tokens JWT para autenticação segura.
  - Validação em cada requisição.

- **Criptografia**:
  - Dados sensíveis armazenados no DynamoDB são criptografados.
  - Requisições à API GPT são protegidas por HTTPS.

- **Políticas IAM**:
  - Permissões restritas às funções Lambda e serviços necessários.

---

## ⚡ **Fluxo do Usuário**
1. **Login**:
   - Usuário faz login, recebendo um token JWT para autenticação.

2. **Inserção de Localização**:
   - O usuário informa sua localização, que é validada e armazenada no DynamoDB.

3. **Consulta de Dados Climáticos**:
   - Requisições são feitas às APIs da Embrapa e processadas pelas Lambdas.

4. **Geração de Resumo Inteligente**:
   - O usuário solicita um resumo.
   - Dados climáticos são enviados a uma Lambda, que faz uma requisição à API GPT.
   - O resumo é gerado e retornado ao usuário.

---

## 📈 **Escalabilidade**
- **Lambda Functions**: Escalam automaticamente conforme a demanda.
- **API Gateway**: Gerencia requisições com alta disponibilidade.
- **DynamoDB**: Suporta grande volume de usuários com latência mínima.
- **GPT Integration**: Configurada para lidar com múltiplas requisições simultâneas.

![image](https://github.com/user-attachments/assets/647a9ec1-1b81-47fa-a908-6bf413ef0fce)


A infraestrutura robusta do **Agro Data** garante uma experiência confiável e inteligente, ajudando agricultores amadores a tomarem decisões baseadas em dados e insights gerados por IA. 🌿
