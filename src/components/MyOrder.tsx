import React, { useEffect, useState } from 'react';
import {
  Accordion,
  Badge,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Loader,
  Box,
  Divider,
  Button,
  Alert
} from '@mantine/core';
import {
  IconPackage,
  IconTruck,
  IconCreditCard,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconUser,
  IconCash,
  IconAlarm,
  IconQrcode,
  IconAlertCircle
} from '@tabler/icons-react';
import { log } from 'console';

interface PaymentBase {
  amount: number;
  created_at: string;
}

interface CashPayment extends PaymentBase {
  type: 'cash';
}

interface OnlinePayment extends PaymentBase {
  type: 'online';
  qr_code_url: string;
  perform_time: string;
}

interface OrderItem {
  price: number;
  quantity: number;
  product: number;
  product_name: string;
  total_price: number;
}


interface Receiver {
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  longitude?: number;
  latitude?: number;
}

 export interface Order {
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
  receiver: Receiver;
  items: OrderItem[];
  cash_payments?: CashPayment[];
  online_payments?: OnlinePayment[];
  created_at: string;
  status_updated: string;
}
const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'завершен': 'green',
    'в обработке': 'blue',
    'отменен': 'red',
    'default': 'yellow'
  };
  return statusMap[status.toLowerCase()] || statusMap.default;
};

const PaymentSection = ({ order }: { order: Order })=> {
  const [qrError, setQrError] = useState<string | null>(null);


  const handleQrCodeClick = (url: string) => {
    try {
      new URL(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setQrError('Invalid QR code URL. Please contact support.');
      console.error('QR code URL error:', e);
    }
  };

  return (
    <Paper shadow="xs" p="md" radius="md">
      <Stack gap="xs">
        <Group gap="xs">
          <IconCreditCard size={18} stroke={1.5} />
          <Text fw={500} size="sm">Детали оплаты</Text>
        </Group>
        <Divider />

        {order.cash_payments?.map((payment, index) => (
          <Group key={`cash-${index}`} justify="space-between">
            <Group gap="xs">
              <IconCash size={18} stroke={1.5} />
              <Text>Наличные оплаты</Text>
              <Badge variant="light" color="gray" size="sm">
                {new Date(payment.created_at).toLocaleString()}
              </Badge>
            </Group>
            <Text fw={500}>{payment.amount.toFixed(2)} сум</Text>
          </Group>
        ))}

        {order.online_payments?.map((payment, index) => (
          <Stack key={`online-${index}`} gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <IconCreditCard size={18} stroke={1.5} />
                <Text>Онлайн оплаты</Text>
                <Badge variant="light" color="gray" size="sm">
                  {new Date(payment.perform_time).toLocaleString()}
                </Badge>
              </Group>
              <Text fw={500}>{payment.amount.toFixed(2)} сум</Text>
            </Group>
          
            {payment.qr_code_url ? (
              <>
                <Button
                  leftSection={<IconQrcode size={18} />}
                  variant="light"
                  onClick={() => handleQrCodeClick(payment.qr_code_url)}
                >
                  ССЫЛКА ДЛЯ НАЛОГА
                </Button>
                {qrError && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {qrError}
                  </Alert>
                )}
              </>
            ) : (
              <Text c="dimmed" size="sm">
                Ссылка недоступна
              </Text>
            )}
          </Stack>
        ))}

        {!order.cash_payments?.length && !order.online_payments?.length && (
          <Text c="dimmed" ta="center">No payment records found</Text>
        )}
      </Stack>
    </Paper>
  );
}
const OrderDetails: React.FC<{ order: Order }> = ({ order }) => (
  <Paper shadow="xs" p="md" radius="md">
    <Stack gap="xs">
      <Group gap="xs">
        <IconCreditCard size={18} stroke={1.5} />
        <Text fw={500} size="sm">Деталт заказа</Text>
      </Group>
      <Divider />
      
      <Group justify="space-between">
        <Text c="dimmed">Общая сумма:</Text>
        <Text fw={500}>{order.total_amount.toFixed(2)} сум</Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">кр коде:</Text>
        <Text fw={500}>{order.payment_type} </Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">Тип оплаты:</Text>
        <Text>{order.payment_type === 1 ? 'Онлайн с картой' : 'Наличными/C картой при доставке'}</Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">Способ доставки:</Text>
        <Text>{order.delivery_type === 1 ? 'убрать из магазина' : 'Доставка'}</Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">Создано в:</Text>
        <Text>{new Date(order.created_at).toLocaleString()}</Text>
      </Group>
      
      {order.use_cashback && (
        <>
          <Group justify="space-between">
            <Text c="dimmed">Исползаванный кешбек:</Text>
            <Text>{order.cashback_used.toFixed(2)} сум</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">Заработанный кешбек:</Text>
            <Text>{order.cashback_earned.toFixed(2)} сум</Text>
          </Group>
        </>
      )}
    </Stack>
  </Paper>
);

const ReceiverInfo: React.FC<{ receiver: Receiver }> = ({ receiver }) => (
  <Paper shadow="xs" p="md" radius="md">
    <Stack gap="xs">
      <Group gap="xs">
        <IconMapPin size={18} stroke={1.5} />
        <Text fw={500} size="sm">Информация о получателе</Text>
      </Group>
      <Divider />
      
      <Group justify="space-between">
        <Text c="dimmed">Имя:</Text>
        <Text>{receiver.first_name}</Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">Фамилия:</Text>
        <Text>{receiver.last_name}</Text>
      </Group>
      <Group justify="space-between">
        <Text c="dimmed">Номер:</Text>
        <Text>{receiver.phone}</Text>
      </Group>
     
    </Stack>
  </Paper>
);

const OrderItems: React.FC<{ items: OrderItem[] }> = ({ items }) => (
  <Paper shadow="xs" p="md" radius="md">
    <Stack gap="xs">
      <Group gap="xs">
        <IconPackage size={18} stroke={1.5} />
        <Text fw={500} size="sm">Items</Text>
      </Group>
      <Divider />
      
      {items.map((item, index) => (
        <Group key={index} justify="space-between" py="xs">
          <Group gap="xs">
            <Text>{item.product_name}</Text>
            <Badge variant="light" color="gray">x{item.quantity}</Badge>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={500}>{item.total_price.toFixed(2)} сум</Text>
            <Text size="xs" c="dimmed">({item.price.toFixed(2)} сум each)</Text>
          </Stack>
        </Group>
      ))}
    </Stack>
  </Paper>
);

const OrderItem: React.FC<{ order: Order }> = ({ order }) => (
  <Accordion.Item value={`order-${order.id}`}>
    <Accordion.Control>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm">
          <IconPackage size={20} stroke={1.5} />
          <Text fw={500}>Order #{order.order_number}</Text>
        </Group>
        <Badge color={getStatusColor(order.status)} variant="light" size="lg">
          {order.status}
        </Badge>
      </Group>
    </Accordion.Control>
    
    <Accordion.Panel>
      <Stack gap="md" mt="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <OrderDetails order={order} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ReceiverInfo receiver={order.receiver} />
          </Grid.Col>
        </Grid>
        
        <OrderItems items={order.items} />
        <PaymentSection order={order} />
      </Stack>
    </Accordion.Panel>
  </Accordion.Item>
);

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found');
      setLoading(false);
      return;
    }

    const ws = new WebSocket(`wss://globus-nukus.uz/ws/orders?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send(JSON.stringify({ type: 'get_orders' }));
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        if (response.type === 'get_orders' && response.success && response.data?.orders) {  
          
          setOrders(response.data.orders);
          console.log(orders);
          

          
        } else if (response.type === 'new_order' && response.success && response.data) {
          setOrders(prevOrders => [response.data, ...prevOrders]);
        } else {
          console.warn('Unexpected WebSocket response:', response);
        }
      } catch (e) {
        console.error('Error processing WebSocket message:', e);
        setError('Error processing server response');
      } finally {
        setLoading(false);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to server');
      setLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  if (loading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loader size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">My Orders</Title>
      <Accordion variant="contained" radius="md" multiple>
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))
        ) : (
          <Paper p="xl" ta="center" c="dimmed">
            No orders found.
          </Paper>
        )}
      </Accordion>
    </Container>
  );
};

export default MyOrders;