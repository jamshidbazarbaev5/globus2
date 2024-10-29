import React, { useState } from "react";
import {
  useCart,
  useUpdateCartItem,
  useDeleteCartItem,
  useDeleteAllCartItems,
} from "../api/queries";
import {
  Card,
  Image,
  Text,
  Button,
  Group,
  NumberInput,
  LoadingOverlay,
  Stack,
  Center,
  Container,
  Title,
  Modal,
  Radio,
  TextInput,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconShoppingCart, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface ProductImage {
  id: number;
  image: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  discounts: null | any;
  price: number;
  discount_price: null | number;
  is_new: boolean;
  amount: number;
  category: number;
  images: ProductImage[];
}

interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  cart_items: number;
}

interface CartData {
  cart: CartItem[];
}

interface CardCreationResponse {
  success: boolean;
  errMessage: string | null;
  errorCode: string | null;
  data: {
    card: {
      number: string;
      expire: string;
      token: string;
      recurrent: boolean;
      verify: boolean;
      type: string;
    };
  };
}

interface VerificationCodeResponse {
  success: boolean;
  errMessage: string | null;
  errorCode: string | null;
  data: {
    sent: boolean;
    phone: string;
    wait: number;
  };
}

export const Cart: React.FC = () => {
  const { data: cartData, isLoading, error } = useCart();
  const updateCartItem = useUpdateCartItem();
  const deleteCartItem = useDeleteCartItem();
  const deleteAllCartItems = useDeleteAllCartItems();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCardCreationForm, setShowCardCreationForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  if (isLoading) return <LoadingOverlay visible={true} />;
  if (error)
    return (
      <Center>
        <Text color="red">Ошибка загрузки корзины: {error.message}</Text>
      </Center>
    );

  if (!cartData || !cartData.cart) {
    return (
      <Center>
        <Text>Данные корзины недоступны</Text>
      </Center>
    );
  }

  const cartItems = cartData.cart;
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <Center style={{ height: 200 }}>
        <Stack align="center">
          <IconShoppingCart size={48} />
          <Title order={2}>Ваша корзина пуста</Title>
        </Stack>
      </Center>
    );
  }

  const handleQuantityChange = async (
    id: number,
    newQuantity: number,
    productId: number
  ) => {
    try {
      await updateCartItem.mutateAsync({
        cartItemId: id,
        quantity: newQuantity,
        productId,
      });
      notifications.show({
        title: "Успешно",
        message: "Количество товара обновлено",
        color: "green",
      });
    } catch (error) {
      console.error("Ошибка при обновлении количества:", error);
      notifications.show({
        title: "Ошибка",
        message: "Не удалось обновить количество",
        color: "red",
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteCartItem.mutateAsync(id);
      notifications.show({
        title: "Успешно",
        message: "Товар удален из корзины",
        color: "green",
      });
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      notifications.show({
        title: "Ошибка",
        message: "Не удалось удалить товар",
        color: "red",
      });
    }
  };

  const handleRedirectToOrderForm = () => {
    if (location.pathname === "/cart") {
      navigate("/order");
    }
  };

  const handleDeleteAllItems = async () => {
    try {
      await deleteAllCartItems.mutateAsync();
      notifications.show({
        title: "Успешно",
        message: "Корзина очищена",
        color: "green",
      });
    } catch (error) {
      console.error("Ошибка при очистке корзины:", error);
      notifications.show({
        title: "Ошибка",
        message: "Не удалось очистить корзину",
        color: "red",
      });
    }
  };

  const handleOrderSubmit = () => {
    if (paymentMethod === "online") {
      setShowCardCreationForm(true);
    } else {
      notifications.show({
        title: "Заказ оформлен",
        message: "Ваш заказ успешно оформлен",
        color: "green",
      });
      setShowOrderForm(false);
    }
  };

  return (
    <Container size="md">
      <Stack>
        <Title order={2}>Корзина</Title>
        {cartItems.map((item) => (
          <Card key={item.id} padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Group>
                <Box 
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(item.product.id);
                  }}
                >
                  <Image
                    src={item.product.images[0]?.image}
                    width={100}
                    height={100}
                    alt={item.product.name}
                  />
                </Box>
                <Stack gap="xs">
                  <Text 
                    fw={500}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(item.product.id);
                    }}
                  >
                    {item.product.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Цена: {item.product.price.toLocaleString()} сум
                  </Text>
                </Stack>
              </Group>
              <Group>
                <NumberInput
                  value={item.quantity}
                  min={1}
                  max={item.product.amount}
                  onChange={(value) =>
                    handleQuantityChange(
                      item.id,
                      Number(value),
                      item.product.id
                    )
                  }
                  styles={{ input: { width: 60 } }}
                />
                <Button
                  color="red"
                  variant="outline"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <IconTrash size={20} />
                </Button>
              </Group>
            </Group>
          </Card>
        ))}
        <Group justify="space-between">
          <Text fw={700} size="lg">
            Общая сумма: {cartTotal.toLocaleString()} сум
          </Text>
          <Button color="red" onClick={handleDeleteAllItems}>
            <Group gap="xs">
              <IconTrash size={20} />
              <span>Очистить корзину</span>
            </Group>
          </Button>
        </Group>
        <Button
          color="blue"
          fullWidth
          size="lg"
          onClick={handleRedirectToOrderForm}
        >
          Оформить заказ
        </Button>
      </Stack>
    </Container>
  );
};