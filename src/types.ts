export interface BrandProduct {
  productName: string;
  productDescription: string;
  brandIdentity: string;
  keyColor: string;
  styling: string;
}

export interface PromptSet {
  productSummary: string;
  billboardPrompt: string;
  newspaperPrompt: string;
  socialPrompt: string;
  slogan: string;
  isLocalFallback?: boolean;
  fallbackExplanation?: string;
  derivedProductName?: string;
  derivedProductDescription?: string;
}

export interface AdShot {
  id: string;
  medium: "billboard" | "newspaper" | "social";
  title: string;
  aspectRatio: "16:9" | "3:4" | "1:1";
  prompt: string;
  imageUrl?: string;
  loading: boolean;
  error?: string;
  warning?: string;
}
