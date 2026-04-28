export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_FAILED';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
