import { GoogleGenAI } from "@google/genai";
import { Transaction, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getFinancialInsights(transactions: Transaction[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const summary = transactions.reduce((acc, t) => {
    const key = t.category;
    if (!acc[key]) acc[key] = 0;
    acc[key] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    Como um assistente financeiro inteligente, analise os seguintes dados de transações do usuário e forneça insights acionáveis em Português.
    
    Resumo por categoria:
    ${JSON.stringify(summary, null, 2)}
    
    Transações recentes:
    ${JSON.stringify(transactions.slice(0, 10), null, 2)}
    
    Por favor, identifique:
    1. Onde o usuário está gastando mais.
    2. Sugestões de economia.
    3. Alertas sobre hábitos incomuns.
    4. Uma mensagem curta e motivadora.
    
    Formate a resposta em Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Erro ao conectar com o assistente de IA.";
  }
}

export async function askFinanceQuestion(question: string, transactions: Transaction[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const ctx = JSON.stringify(transactions.slice(0, 50));
  
  const prompt = `
    Usuário pergunta: "${question}"
    
    Contexto das transações (JSON):
    ${ctx}
    
    Responda de forma concisa e amigável em Português, baseando-se estritamente nos dados fornecidos se for sobre gastos específicos.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    console.error("Error asking AI:", error);
    return "Erro ao processar sua pergunta.";
  }
}
