export interface CartLine {
  productId: string;
  /** Database order_items.id; present only for persisted order lines. */
  orderItemId?: string;
  storeId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  availableStock?: number;
  imageUrl?: string;
  category?: string;
}
