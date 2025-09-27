// Enum for OrderType (same as Python Enum)
export enum OrderType {
  Bid = "Bid",
  Ask = "Ask",
}

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
export interface Order {
  id: number;
  type: OrderType;
  item_id: number;
  user_id: number;
  price: number;
}

// ---- Trade ----
export interface Trade {
  id: number;
  buyer_id: number;
  seller_id: number;
  item_id: number;
  price: number;
}
