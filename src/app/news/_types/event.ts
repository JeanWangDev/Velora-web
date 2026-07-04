export type EventListItem = {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string;
  url: string;
  cover: string;
  symbols: string[];
  primarySymbol: string;
  sentiment: string;
  impact: number;
  publishedAt: number;
  ingestedAt: number;
};

export type EventDetail = EventListItem;

export type EventListResponse = {
  data: EventListItem[];
  total: number;
  page: number;
  pageSize: number;
};
