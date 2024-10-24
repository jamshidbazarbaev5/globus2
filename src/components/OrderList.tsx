import React from 'react';
import { Table, Badge, Text, ScrollArea, Group } from '@mantine/core';
import { IconPackage, IconCreditCard, IconTruck } from '@tabler/icons-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  amount: number;
  status: string;
  payment_type: number;
  delivery_type: number;
  items: OrderItem[];
  created_at: string;
}

interface OrderListProps {
  orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ожидает подтверждения':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getPaymentType = (type: number) => {
    return type === 1 ? 'Online' : 'Cash/Card on Delivery';
  };

  const getDeliveryType = (type: number) => {
    return type === 1 ? 'Pickup' : 'Delivery';
  };

  const rows = orders.map((order) => (
    <Table.Tr key={order.id}>
      <Table.Td>{order.order_number}</Table.Td>
      <Table.Td>{order.amount.toFixed(2)} сум</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(order.status)}>{order.status}</Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconCreditCard size={16} />
          <Text size="sm">{getPaymentType(order.payment_type)}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconTruck size={16} />
          <Text size="sm">{getDeliveryType(order.delivery_type)}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconPackage size={16} />
          <Text size="sm">{order.items.length} item(s)</Text>
        </Group>
      </Table.Td>
      <Table.Td>{new Date(order.created_at).toLocaleString()}</Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Order Number</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Payment</Table.Th>
            <Table.Th>Delivery</Table.Th>
            <Table.Th>Items</Table.Th>
            <Table.Th>Created At</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}