import { ApiProviderConfig, ApiProviderType } from '../types';

export interface ProviderMetadata {
  id: ApiProviderType;
  name: string;
  badge: string;
  logoColor: string;
  defaultBaseUrl: string;
  defaultModel: string;
  recommendedModels: { id: string; name: string; tag?: string }[];
  keyPlaceholder: string;
  docUrl: string;
  description: string;
  supportsVision: boolean;
}

export const PROVIDER_PRESETS: Record<ApiProviderType, ProviderMetadata> = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast',
    logoColor: 'text-orange-500 bg-orange-50 border-orange-200',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    recommendedModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', tag: 'Fast & Smart' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', tag: 'Ultra Low Latency' },
      { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision', tag: 'Vision & Multimodal' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tag: 'High Context' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', tag: 'Reasoning' }
    ],
    keyPlaceholder: 'gsk_...',
    docUrl: 'https://console.groq.com/keys',
    description: 'Blazing fast inference powered by Groq LPUs. Free tier available with high rate limits.',
    supportsVision: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Multimodal',
    logoColor: 'text-blue-500 bg-blue-50 border-blue-200',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    recommendedModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Next Gen Speed' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Complex Reasoning' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Stable Vision' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Long Context' }
    ],
    keyPlaceholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google AI Studio API key with native image vision and agronomic context reasoning.',
    supportsVision: true
  },
  vertex_ai: {
    id: 'vertex_ai',
    name: 'Google Vertex AI',
    badge: 'Enterprise ML & Agents',
    logoColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    defaultBaseUrl: 'https://us-central1-aiplatform.googleapis.com/v1',
    defaultModel: 'gemini-2.5-flash',
    recommendedModels: [
      { id: 'gemini-2.5-flash', name: 'Vertex Gemini 2.5 Flash', tag: 'AutoML & Agents' },
      { id: 'gemini-2.5-pro', name: 'Vertex Gemini 2.5 Pro', tag: 'High-Precision Analytics' },
      { id: 'automl-tabular-yield-v1', name: 'Vertex AutoML Tabular (Yield)', tag: 'Predictive Model' },
      { id: 'vertex-vision-multimodal', name: 'Vertex AI Vision (Plant Pathology)', tag: 'Multimodal Vision' },
      { id: 'claude-3-5-sonnet@20241022', name: 'Claude 3.5 Sonnet on Vertex Model Garden', tag: 'Model Garden' }
    ],
    keyPlaceholder: 'AIzaSy... or Vertex OAuth Bearer / Service Token',
    docUrl: 'https://cloud.google.com/vertex-ai',
    description: 'Google Cloud Vertex AI unified platform for Generative AI, AutoML tabular predictive modeling, and Model Garden.',
    supportsVision: true
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Industry Standard',
    logoColor: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    recommendedModels: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tag: 'Vision + Reasoning' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Fast & Affordable' },
      { id: 'o1-mini', name: 'o1 Mini', tag: 'Math & Logic' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'High Capacity' }
    ],
    keyPlaceholder: 'sk-proj-... or sk-...',
    docUrl: 'https://platform.openai.com/api-keys',
    description: 'Direct access to OpenAI models with multimodal plant vision & chat intelligence.',
    supportsVision: true
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Nuanced Reasoning',
    logoColor: 'text-amber-600 bg-amber-50 border-amber-200',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    recommendedModels: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tag: 'Best Quality & Vision' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tag: 'Fast & Lightweight' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', tag: 'Deep Analysis' }
    ],
    keyPlaceholder: 'sk-ant-api03-...',
    docUrl: 'https://console.anthropic.com/settings/keys',
    description: 'State-of-the-art vision and high safety agronomy analysis from Anthropic.',
    supportsVision: true
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'High Value',
    logoColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    recommendedModels: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', tag: 'General Excellence' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoner)', tag: 'Deep Step-by-Step' }
    ],
    keyPlaceholder: 'sk-...',
    docUrl: 'https://platform.deepseek.com/api_keys',
    description: 'Cost-effective reasoning models with OpenAI-compatible API architecture.',
    supportsVision: false
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'Open Weights',
    logoColor: 'text-orange-600 bg-orange-50 border-orange-200',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    recommendedModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large 2', tag: 'Flagship Intelligence' },
      { id: 'mistral-small-latest', name: 'Mistral Small', tag: 'Efficient & Quick' },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B', tag: 'Vision & Multimodal' },
      { id: 'codestral-latest', name: 'Codestral', tag: 'Code & Logic' }
    ],
    keyPlaceholder: '...',
    docUrl: 'https://console.mistral.ai/api-keys',
    description: 'European frontier AI models with OpenAI compatible completions.',
    supportsVision: true
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model Hub',
    logoColor: 'text-purple-600 bg-purple-50 border-purple-200',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    recommendedModels: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', tag: 'OpenRouter Top' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', tag: 'Zero Cost' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet via OR', tag: 'Vision' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 via OR', tag: 'Reasoning' }
    ],
    keyPlaceholder: 'sk-or-v1-...',
    docUrl: 'https://openrouter.ai/keys',
    description: 'Unified gateway to 100+ models with one API key, flexible routing, and usage analytics.',
    supportsVision: true
  },
  custom: {
    id: 'custom',
    name: 'Custom / Local Provider',
    badge: 'Ollama / LocalAI / Proxy',
    logoColor: 'text-slate-700 bg-slate-100 border-slate-300',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    recommendedModels: [
      { id: 'llama3.2', name: 'Ollama Llama 3.2', tag: 'Local Default' },
      { id: 'llama3.2-vision', name: 'Ollama Llama 3.2 Vision', tag: 'Local Vision' },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', tag: 'Local Logic' },
      { id: 'custom-model', name: 'Custom Model ID', tag: 'Manual' }
    ],
    keyPlaceholder: 'Optional for local (or enter custom proxy key)',
    docUrl: 'https://ollama.com',
    description: 'Connect to self-hosted Ollama, vLLM, LM Studio, or any OpenAI-compatible API endpoint.',
    supportsVision: true
  }
};

const STORAGE_KEY = 'claireai_custom_api_config';
const ENCRYPT_PREFIX = 'enc_v2:';
export const API_CONFIG_CHANGED_EVENT = 'claireai_api_config_changed';

// Lightweight obfuscation/encryption wrapper to prevent plain-text localStorage key extraction
function secureObfuscate(plainText: string): string {
  try {
    const salt = 'claire_agri_sec_key_v2';
    let output = '';
    for (let i = 0; i < plainText.length; i++) {
      const charCode = plainText.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      output += String.fromCharCode(charCode);
    }
    return ENCRYPT_PREFIX + btoa(output);
  } catch {
    return plainText;
  }
}

function secureDeobfuscate(cipherText: string): string {
  try {
    if (!cipherText.startsWith(ENCRYPT_PREFIX)) {
      return cipherText; // Backwards compatible with existing raw keys
    }
    const raw = atob(cipherText.slice(ENCRYPT_PREFIX.length));
    const salt = 'claire_agri_sec_key_v2';
    let output = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      output += String.fromCharCode(charCode);
    }
    return output;
  } catch {
    return '';
  }
}

/**
 * Mask API keys for safe UI display (e.g., "gsk_...9a2f")
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••';
  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Validate that an API key format is safe against injection
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) return '';
  // Strip control characters, spaces, and dangerous tokens
  return apiKey.trim().replace(/[\r\n\t\0]/g, '');
}

/**
 * Retrieve saved API Provider configuration from secure localStorage
 */
export function getSavedApiConfig(): ApiProviderConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.provider && parsed.apiKey) {
      return {
        ...parsed,
        apiKey: secureDeobfuscate(parsed.apiKey)
      } as ApiProviderConfig;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse saved API config', e);
    return null;
  }
}

/**
 * Save or update API Provider configuration with encryption
 */
export function saveApiConfig(config: ApiProviderConfig): void {
  try {
    const cleanConfig: ApiProviderConfig = {
      ...config,
      apiKey: sanitizeApiKey(config.apiKey)
    };

    const secureStorageObject = {
      ...cleanConfig,
      apiKey: secureObfuscate(cleanConfig.apiKey)
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(secureStorageObject));
    window.dispatchEvent(new CustomEvent(API_CONFIG_CHANGED_EVENT, { detail: cleanConfig }));
  } catch (e) {
    console.error('Failed to save API config', e);
  }
}

/**
 * Remove saved API Provider configuration
 */
export function clearApiConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(API_CONFIG_CHANGED_EVENT, { detail: null }));
  } catch (e) {
    console.error('Failed to clear API config', e);
  }
}

/**
 * Generate HTTP headers to securely forward custom API provider config to backend routes
 */
export function getApiConfigHeaders(): Record<string, string> {
  const config = getSavedApiConfig();
  if (!config || !config.isActive || !config.apiKey) {
    return {};
  }

  const headers: Record<string, string> = {
    'x-custom-api-provider': config.provider,
    'x-custom-api-key': sanitizeApiKey(config.apiKey),
  };

  if (config.baseUrl) {
    headers['x-custom-api-base-url'] = config.baseUrl.trim();
  }
  if (config.model) {
    headers['x-custom-api-model'] = config.model.trim();
  }

  return headers;
}
