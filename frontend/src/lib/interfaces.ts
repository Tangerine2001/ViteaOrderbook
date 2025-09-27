// ---- User ----
export interface User {
  id: number;
  name: string;
}

// ---- Item ----
export interface Item {
  id: number;
  name: string;
  description?: string | null;
}

// ---- Order ----
export enum OrderType {
  Bid = "Bid",   // Buy
  Ask = "Ask",   // Sell
}

export enum OrderKind {
  Limit = "Limit",
  Market = "Market",
}

export interface Order {
  id: number;
  side: OrderType;       // Bid or Ask
  kind: OrderKind;       // Limit or Market
  price?: number | null; // Optional because Market orders may not have price
  item_id: number;
  user_id: number;
}


// ---- Trade ----
export interface Trade {
  id: number;
  buyer_id: number;
  seller_id: number;
  item_id: number;
  price: number;
}
