import type { AIChatRequest, AIChatResponse } from '../types/aiTypes';

export class TerritorialAIService {
  static async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `El servicio IA respondió ${response.status}`);
    }

    return response.json() as Promise<AIChatResponse>;
  }

  static async health(): Promise<{ status: string; langchain: boolean; langflow: boolean; mode: string }> {
    const response = await fetch('/api/ai/health');
    if (!response.ok) throw new Error('Servicio IA no disponible');
    return response.json();
  }
}
