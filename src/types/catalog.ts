export type CatalogColor = {
  id: string;
  name: string;
  hexCode: string;
  imageUrl?: string | null;
};

export type LetterStyle = {
  id: string;
  name: string;
  description: string;
  previewText: string;
  imageUrl?: string | null;
  accentColor: string;
  clickCount: number;
};

export type TowelType = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  clickCount: number;
  availableColors: CatalogColor[];
};

export type TowelModel = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  clickCount: number;
  towelType: TowelType;
  availableColors: CatalogColor[];
};

export type Feedback = {
  id: string;
  authorName: string;
  message: string;
  approved: boolean;
  rating: number;
  createdAt: string;
};

export type ReadyMadeItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  priceLabel: string;
  towelType: TowelType;
  towelModel?: TowelModel | null;
  letterStyle?: LetterStyle | null;
  colors: CatalogColor[];
  feedbacks: Feedback[];
};

export type PublicCatalogResponse = {
  whatsappNumber: string;
  letterStyles: LetterStyle[];
  towelTypes: TowelType[];
  towelModels: TowelModel[];
  readyMadeItems: ReadyMadeItem[];
};

export type AdminCatalogResponse = PublicCatalogResponse & {
  colorOptions: CatalogColor[];
  feedbacks: Feedback[];
};

export type AdminStatsResponse = {
  topLetters: LetterStyle[];
  topTowelTypes: TowelType[];
  topTowelModels: TowelModel[];
  pendingFeedbacks: number;
};
