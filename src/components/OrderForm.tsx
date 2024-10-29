  import React, { useEffect, useRef, useState, useCallback } from "react";
  import {
    useCart,
    useCreateCard,
    useDelivery,
    useGetVerificationCode,
    useCreateReceipt,
    usePayReceipt,
    useVerifyCard,
    useCheckCard,
    useDeleteAllCartItems,
  } from "../api/queries";
  import {
    Card,
    Image,
    Text,
    Button,
    Group,
    Stack,
    Container,
    Title,
    Checkbox,
    TextInput,
    LoadingOverlay,
    Modal,
  } from "@mantine/core";
  import { notifications } from "@mantine/notifications";
  import {
    IconShoppingCart,
    IconCreditCard,
  } from "@tabler/icons-react";
  import { useAuth } from "../context/context";
  import { useNavigate } from "react-router-dom";

  interface CartItem {
    id: number;
    product: {
      id: number;
      name: string;
      price: number;
      images: { image: string }[];
    };
    quantity: number;
  }

  const OrderForm: React.FC = () => {
    const { data: cartData, isLoading: isCartLoading } = useCart();
    const { data: deliveryData, isLoading: isDeliveryLoading } = useDelivery();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isDelivery, setIsDelivery] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
    const [useCashback, setUseCashback] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [cardToken, setCardToken] = useState("");
    const [invoiceId, setInvoiceId] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [orderId, setOrderId] = useState<string>();

    const createCardMutation = useCreateCard();
    const getVerificationCodeMutation = useGetVerificationCode();
    const payReceiptMutation = usePayReceipt();
    const createReceiptMutation = useCreateReceipt();
    const verifyCardMutation = useVerifyCard();
    const checkCardMutation = useCheckCard();
    const deleteAllCartItems = useDeleteAllCartItems();

    const ws = useRef<WebSocket | null>(null);
    const token = localStorage.getItem("token");

    const connectWebSocket = useCallback(() => {
      setIsConnecting(true);
      ws.current = new WebSocket(`wss://globus-nukus.uz/ws/orders?token=${token}`);

      ws.current.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setIsConnecting(false);
        notifications.show({
          title: "Connection Error",
          message: "Failed to connect to the server. Retrying...",
          color: "red",
        });
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event);
        setIsConnected(false);
        setIsConnecting(false);
        if (!event.wasClean || event.code === 1006) {
          notifications.show({
            title: "Connection Lost",
            message: "Connection to the server was lost. Attempting to reconnect...",
            color: "yellow",
          });
          setTimeout(connectWebSocket, 5000);
        }
      };
    }, [token]);

    useEffect(() => {
      connectWebSocket();
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }, [connectWebSocket]);

    const cartTotal = cartData?.cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    ) || 0;
    const minDeliveryAmount = deliveryData?.minimumSum || 200000;
    const freeDistance = 3;
    const pricePerKm = 3000;
    const deliveryCost = isDelivery
      ? cartTotal >= minDeliveryAmount
        ? 0
        : pricePerKm * freeDistance
      : 0;
    const totalAmount = cartTotal + deliveryCost;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !isConnected) {
        notifications.show({
          title: "Connection Error",
          message: "Not connected to the server. Please try again later.",
          color: "red",
        });
        return;
      }

      const order = {
        type: "create_order",
        message: {
          amount: totalAmount,
          payment_type: paymentMethod === "cash" ? 2 : 1,
          delivery_type: isDelivery ? 2 : 1,
          use_cashback: useCashback,
          receiver: {
            first_name: user?.first_name,
            last_name: user?.last_name,
            phone: user?.phone,
            longitude: isDelivery ? 25.552 : null,
            latitude: isDelivery ? 54.548 : null,
          },
          items: cartData?.cart.map((item) => ({
            product: item.product.id,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      };

      ws.current.onmessage = async (event) => {
        const response = JSON.parse(event.data);
        console.log("WebSocket response:", response);

        if (response.type === "order_created") {
          const newOrderId = response.data?.id;
          setOrderId(newOrderId);

          if (paymentMethod === "online") {
            try {
              const receiptResult = await createReceiptMutation.mutateAsync({
                amount: totalAmount,
                order_id: newOrderId
              });

              if (receiptResult.success) {
                setInvoiceId(receiptResult.data.receipt._id);
                setShowCardModal(true);
              } else {
                throw new Error(receiptResult.errMessage || "Failed to create receipt");
              }
            } catch (error) {
              console.error("Error creating receipt:", error);
              notifications.show({
                title: "Error",
                message: "Failed to create receipt. Please try again later.",
                color: "red",
              });
            }
          } else {
            notifications.show({
              title: "Order Created",
              message: `Order #${response.data?.order_number} has been created successfully.`,
              color: "green",
            });
            navigate("/my-orders");
            await deleteAllCartItems.mutateAsync();
          }
        }
      };

      ws.current.send(JSON.stringify(order));
    };

    const handleCreateCard = async () => {
      try {
        if (!cardNumber || !expiryDate) {
          throw new Error("Card number and expiry date are required");
        }

        const result = await createCardMutation.mutateAsync({
          card_number: cardNumber,
          expire_date: expiryDate,
        });

        if (result.success) {
          setCardToken(result.data.card.token);
          setShowCardModal(false);
          setShowVerificationModal(true);
          await handleGetVerificationCode(result.data.card.token);
        } else {
          throw new Error(result.errMessage || "Failed to create card");
        }
      } catch (error) {
        console.error("Error in handleCreateCard:", error);
        notifications.show({
          title: "Error",
          message: error instanceof Error
            ? error.message
            : "An error occurred while creating the card",
          color: "red",
        });
      }
    };

    const handleGetVerificationCode = async (token: string) => {
      try {
        const result = await getVerificationCodeMutation.mutateAsync(token);
        if (result.success) {
          notifications.show({
            title: "Verification Code Sent",
            message: `Verification code sent to ${result.data.phone}. Please wait ${
              result.data.wait / 1000
            } seconds before requesting again.`,
            color: "green",
          });
        } else {
          throw new Error(result.errMessage || "Failed to get verification code");
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: error instanceof Error
            ? error.message
            : "An error occurred while getting the verification code",
          color: "red",
        });
      }
    };

    const handleVerifyAndPay = async () => {
      try {
        const verifyResult = await verifyCardMutation.mutateAsync({
          token: cardToken,
          code: verificationCode,
        });

        if (!verifyResult.success) {
          throw new Error(verifyResult.errMessage || "Failed to verify card");
        }

        const paymentResult = await payReceiptMutation.mutateAsync({
          token: cardToken,
          invoice_id: invoiceId,
        });

        if (paymentResult.success) {
          setShowVerificationModal(false);
          notifications.show({
            title: "Payment Successful",
            message: "Your order has been successfully paid.",
            color: "green",
          });
          navigate("/my-orders");
          await deleteAllCartItems.mutateAsync();
        } else {
          throw new Error(paymentResult.errMessage || "Failed to process payment");
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        notifications.show({
          title: "Payment Error",
          message: error instanceof Error ? error.message : "An error occurred while processing the payment",
          color: "red",
        });
      }
    };

    if (isCartLoading || isDeliveryLoading) {
      return <LoadingOverlay visible={true} />;
    }

    return (
      <Container size="md">
        {!isConnected && (
          <>
            <Text color="red" mb="md">
              {isConnecting
                ? "Подключение к серверу..."
                : "Нет подключения к серверу. Некоторые функции могут быть недоступны."}
            </Text>
            {!isConnecting && (
              <Button onClick={connectWebSocket} mb="md" color="blue">
                Переподключиться к серверу
              </Button>
            )}
          </>
        )}
  
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={2}>Оформление заказа</Title>
  
            {cartData?.cart.map((item: CartItem) => (
              <Card key={item.id} padding="sm" radius="md" withBorder>
                <Group>
                  <Image
                    src={item.product.images[0]?.image}
                    width={50}
                    height={50}
                    alt={item.product.name}
                  />
                  <Text>
                    {item.product.name} x {item.quantity}
                  </Text>
                  <Text ml="auto">
                    {(item.product.price * item.quantity).toLocaleString()} сум
                  </Text>
                </Group>
              </Card>
            ))}
  
            <Stack>
              <Title order={3}>Способ доставки</Title>
              <Checkbox
                label="Самовывоз из Глобус Нукус #1"
                checked={!isDelivery}
                onChange={() => setIsDelivery(false)}
              />
              <Checkbox
                label={`Доставка ${
                  cartTotal >= minDeliveryAmount
                    ? "(бесплатно)"
                    : `(${deliveryCost.toLocaleString()} сум)`
                }`}
                checked={isDelivery}
                onChange={() => setIsDelivery(true)}
              />
            </Stack>
  
            {!isDelivery && (
              <Text>
                Адрес магазина: FJ65+C75, Нукус, Республика Каракалпакстан,
                Узбекистан
              </Text>
            )}
  
            <Stack>
              <Title order={3}>Личная информация</Title>
              <TextInput
                label="Имя"
                required
                value={user?.first_name}
                readOnly
              />
              <TextInput
                label="Фамилия"
                required
                value={user?.last_name}
                readOnly
              />
              <TextInput 
                label="Телефон" 
                required 
                value={user?.phone} 
                readOnly 
              />
              {isDelivery && (
                <TextInput
                  label="Адрес"
                  required
                />
              )}
            </Stack>
  
            <Stack>
              <Title order={3}>Способ оплаты</Title>
              <Checkbox
                label="Наличными"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />
              <Checkbox
                label="Онлайн оплата"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
              />
            </Stack>
  
            <Checkbox
              label="Использовать кэшбэк"
              checked={useCashback}
              onChange={(event) => setUseCashback(event.currentTarget.checked)}
            />
  
            <Group justify="apart">
              <Text size="xl" fw={700}>
                Итого: {totalAmount.toLocaleString()} сум
              </Text>
              <Button
                type="submit"
                size="lg"
                color="blue"
                leftSection={<IconShoppingCart size={20} />}
              >
                Оформить заказ
              </Button>
            </Group>
          </Stack>
        </form>
  
        <Modal
          opened={showCardModal}
          onClose={() => setShowCardModal(false)}
          title="Добавить карту"
        >
          <Stack>
            <TextInput
              label="Номер карты"
              placeholder="Введите номер карты"
              required
              onChange={(e) => setCardNumber(e.currentTarget.value)}
            />
            <TextInput
              label="Срок действия"
              placeholder="ММ/ГГ"
              required
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <Button
              onClick={handleCreateCard}
              disabled={!cardNumber || !expiryDate}
              leftSection={<IconCreditCard size={20} />}
            >
              Добавить карту
            </Button>
          </Stack>
        </Modal>
  
        <Modal
          opened={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          title="Подтверждение оплаты"
        >
          <Stack>
            <TextInput
              label="Код подтверждения"
              placeholder="Введите код подтверждения"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.currentTarget.value)}
            />
            <Button 
              onClick={handleVerifyAndPay} 
              disabled={!verificationCode}
            >
              Подтвердить и оплатить
            </Button>
          </Stack>
        </Modal>
      </Container>
    );
  
  };

  export default OrderForm;