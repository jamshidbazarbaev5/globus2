export interface OrderReceiver {
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  longitude?: number;
  latitude?: number;
}

export interface OrderItem {
  product: number;
  price: number;
  quantity: number;
}

export interface CreateOrderMessage {
  amount: number;
  payment_type: 1 | 2; // 1: "Картой онлайн", 2: "Наличными или картой при получении"
  delivery_type: 1 | 2; // 1: "Самовывоз", 2: "Курьерская доставка"
  use_cashback: boolean;
  receiver: OrderReceiver;
  items: OrderItem[];
}

export interface CashPayment {
  amount: number;
  type: string;
  created_at: string;
}

export interface OnlinePayment {
  amount: number;
  qr_code_url: string;
  perform_time: string;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  amount: number;
  total_amount: number;
  use_cashback: boolean;
  cashback_earned: number;
  cashback_used: number;
  status: string;
  payment_type: number;
  delivery_type: number;
  receiver: OrderReceiver;
  items: Array<{
    price: number;
    quantity: number;
    product: number;
    product_name: string;
    total_price: number;
  }>;
  cash_payments: CashPayment[];
  online_payments: OnlinePayment[];
  created_at: string;
  status_updated: string;
}

export interface ErrorResponse {
  type: 'error';
  success: false;
  errMessage: string;
  errorCode: number;
  data: null;
}

// orderWebSocket.ts
export class OrderWebSocket {
  private ws: WebSocket | null = null;
  private readonly token: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private onOrdersUpdate: (orders: OrderResponse[]) => void;
  private onOrderCreate: (response: OrderResponse | ErrorResponse) => void;
  private onError: (error: any) => void;

  constructor(
    token: string,
    onOrdersUpdate: (orders: OrderResponse[]) => void,
    onOrderCreate: (response: OrderResponse | ErrorResponse) => void,
    onError: (error: any) => void
  ) {
    this.token = token;
    this.onOrdersUpdate = onOrdersUpdate;
    this.onOrderCreate = onOrderCreate;
    this.onError = onError;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(`wss://globus-nukus.uz/ws/orders?token=${this.token}`);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.handleError('Connection failed', error);
    }
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        this.handleError('Failed to parse message', error);
      }
    };

    this.ws.onerror = (error) => {
      this.handleError('WebSocket error', error);
    };

    this.ws.onclose = () => {
      this.handleClose();
    };
  }

  private handleMessage(data: any) {
    if (Array.isArray(data)) {
      this.onOrdersUpdate(data);
    } else if (data.type === 'create_order') {
      this.onOrderCreate(data);
    } else if (data.type === 'error') {
      this.onOrderCreate(data as ErrorResponse);
    } else {
      this.handleError('Unknown message type', data);
    }
  }

  private handleError(context: string, error: any) {
    console.error(`${context}:`, error);
    this.onError(error);
  }

  private handleClose() {
    console.log('WebSocket connection closed');
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  public createOrder(orderData: CreateOrderMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'create_order',
      message: orderData
    };

    this.ws.send(JSON.stringify(message));
  }

  public getOrders() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: 'get_orders'
    };

    this.ws.send(JSON.stringify(message));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
