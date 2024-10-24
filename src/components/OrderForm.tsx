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
import { useMutation } from "@tanstack/react-query";
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
  NumberInput,
  Modal,
  LoadingOverlay,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingCart,
  IconCreditCard,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useAuth } from "../context/context";
import { useNavigate } from "react-router-dom";
import { log } from "node:console";

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
  const [isConnected, setIsConnected] = useState(false); // Added connection status
  const [isConnecting, setIsConnecting] = useState(false); // Added connection status

  const createCardMutation = useCreateCard();
  const getVerificationCodeMutation = useGetVerificationCode();
  const payReceiptMutation = usePayReceipt();
  const createReceiptMutation = useCreateReceipt();
  const verifyCardMutation = useVerifyCard();
  const checkCardMutation = useCheckCard();
  const deleteAllCartItems = useDeleteAllCartItems();

  const ws = useRef<WebSocket | null>(null);
  const token = localStorage.getItem("token");
  const [orderId, setOrderId] = useState();
  const connectWebSocket = useCallback(() => {
    setIsConnecting(true);
    ws.current = new WebSocket(
      `wss://globus-nukus.uz/ws/orders?token=${token}`
    );

    ws.current.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      setIsConnecting(false);
    };

    ws.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.type === "order_created") {
        setOrderId(response.order_id)
      console.log(orderId)
        notifications.show({
          title: "Order Created",
          message: `Order successfully created with ID: ${response.order_id}`,
          color: "green",
        });
        navigate("/my-orders");
        deleteAllCartItems.mutateAsync();
      }
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
          message:
            "Connection to the server was lost. Attempting to reconnect...",
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

  const cartTotal =
    cartData?.cart.reduce(
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

  const handleCreateOrder = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isConnected) {
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
            longitude: 25.552,
            latitude: 54.548,
          },
          items: cartData?.cart.map((item) => ({
            product: item.product.id,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      };
      ws.current.send(JSON.stringify(order));
      console.log(order);
    } else {
      notifications.show({
        title: "Connection Error",
        message: "Not connected to the server. Please try again later.",
        color: "red",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (paymentMethod === "online") {
      try {
        await handleCreateReceipt();

        setShowCardModal(true);
      } catch (error) {
        console.error("Error creating receipt:", error);
        notifications.show({
          title: "Error",
          message: "Failed to create receipt. Please try again later.",
          color: "red",
        });
      }
    } else {
      handleCreateOrder();
    }
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
        message:
          error instanceof Error
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
          message: `Verification code sent to ${
            result.data.phone
          }. Please wait ${
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
        message:
          error instanceof Error
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
        handleCreateOrder();
      } else {
        throw new Error(
          paymentResult.errMessage || "Failed to process payment"
        );
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      notifications.show({
        title: "Payment Error",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the payment",
        color: "red",
      });
    }
  };

  const handleCreateReceipt = async () => {
    try {
      const payload = {
        amount: totalAmount,
        order_id: 84
      };

      const result = await createReceiptMutation.mutateAsync(payload);

      if (result.success) {
        setInvoiceId(result.data.receipt._id);
      } else {
        throw new Error(result.errMessage || "Failed to create receipt");
      }
    } catch (error) {
      console.error("Error occurred in handleCreateReceipt:", error);
      throw new Error("An error occurred while creating the receipt");
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
              ? "Connecting to server..."
              : "Not connected to the server. Some features may be unavailable."}
          </Text>
          {!isConnecting && (
            <Button onClick={connectWebSocket} mb="md" color="blue">
              Reconnect to Server
            </Button>
          )}
        </>
      )}
      <form onSubmit={handleSubmit}>
        <Stack>
          <Title order={2}>Order Checkout</Title>

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
                  {(item.product.price * item.quantity).toLocaleString()} sum
                </Text>
              </Group>
            </Card>
          ))}

          <Stack>
            <Title order={3}>Delivery Method</Title>
            <Checkbox
              label="Pickup from Globus Nukus #1"
              checked={!isDelivery}
              onChange={() => setIsDelivery(false)}
            />
            <Checkbox
              label={`Delivery ${
                cartTotal >= minDeliveryAmount
                  ? "(free)"
                  : `(${deliveryCost.toLocaleString()} sum)`
              }`}
              checked={isDelivery}
              onChange={() => setIsDelivery(true)}
            />
          </Stack>

          {!isDelivery && (
            <Text>
              Store address: FJ65+C75, Nukus, Qoraqalpog'iston Respublikasi,
              Uzbekistan
            </Text>
          )}

          <Stack>
            <Title order={3}>Personal Information</Title>
            <TextInput
              label="First Name"
              required
              value={user?.first_name}
              readOnly
            />
            <TextInput
              label="Last Name"
              required
              value={user?.last_name}
              readOnly
            />
            <TextInput label="Phone" required value={user?.phone} readOnly />
          </Stack>

          <Stack>
            <Title order={3}>Payment Method</Title>
            <Checkbox
              label="Cash"
              checked={paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            <Checkbox
              label="Online Payment"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
            />
          </Stack>

          <Checkbox
            label="Use Cashback"
            checked={useCashback}
            onChange={(event) => setUseCashback(event.currentTarget.checked)}
          />

          <Group justify="apart">
            <Text size="xl" fw={700}>
              Total: {totalAmount.toLocaleString()} sum
            </Text>
            <Button
              type="submit"
              size="lg"
              color="blue"
              leftSection={<IconShoppingCart size={20} />}
            >
              Place Order
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={showCardModal}
        onClose={() => setShowCardModal(false)}
        title="Add Card"
      >
        <Stack>
          <TextInput
            label="Card Number"
            placeholder="Enter card number"
            required
            onChange={(e) => setCardNumber(e.currentTarget.value)}
          />
          <TextInput
            label="Expiry Date"
            placeholder="MM/YY"
            required
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <Button
            onClick={handleCreateCard}
            disabled={!cardNumber || !expiryDate}
            leftSection={<IconCreditCard size={20} />}
          >
            Add Card
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Payment Confirmation"
      >
        <Stack>
          <TextInput
            label="Verification Code"
            placeholder="Enter verification code"
            required
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.currentTarget.value)}
          />
          <Button onClick={handleVerifyAndPay} disabled={!verificationCode}>
            Verify and Pay
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
};

export default OrderForm;
