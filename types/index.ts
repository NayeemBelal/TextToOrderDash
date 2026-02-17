// Core types for TextToOrder Dashboard

export interface Order {
  id: string;
  restaurant_id: string;
  customer_id: string;
  conversation_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  name: string;
  price: number;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone_number: string;
  created_at: string;
}

export interface RevenueData {
  timestamp: string;
  revenue: number;
}

export interface TimeFilter {
  label: string;
  value: '1h' | '24h' | '1w' | '1m' | 'custom';
  hours: number;
}

export interface MenuItemStats {
  item_name: string;
  order_count: number;
  is_hot: boolean;
}

// Menu Items API Types
export interface MenuItemModifier {
  id: string;
  name: string;
  price: number;
  price_cents: number;
}

export interface MenuItemModifierGroup {
  name: string;
  modifiers: MenuItemModifier[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  price_cents: number;
  category: string | null;
  category_id: string | null;
  modifier_groups: MenuItemModifierGroup[];
  available: boolean;
  orders: number;
  revenue: number;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItemsResponse {
  items: MenuItem[];
  total_items: number;
  categories: MenuCategory[];
  fetched_at: string;
}
