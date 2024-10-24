import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  Image,
  Text,
  Group,
  Badge,
  Loader,
  Box,
  Button,
  Title,
  Stack,
  useMantineTheme,
  NumberInput,
  Notification,
  rem,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  useProduct,
  useCategories,
  useProducts,
  useAddToCart,
  useDeleteCartItem,
  useCart,
} from "../api/queries";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedCategory } from "../redux/categorySlice";
import { RootState } from "../redux/store";
import { IProduct } from "../models/models";
import { IconX, IconCheck } from '@tabler/icons-react';
import { log } from "node:console";




export const ProductDetail: React.FC = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationColor, setNotificationColor] = useState('red');

  const selectedCategory = useSelector(
    (state: RootState) => state.category.selectedCategory
  );
  

  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
  } = useProduct(Number(id));

  const { data: categories } = useCategories();
  const { data: relatedProductsData, isLoading: isRelatedLoading } =
    useProducts(1, 12, undefined, selectedCategory || product?.category);

  const addToCartMutation = useAddToCart();
  const deleteCartItemMutation = useDeleteCartItem();
  const { data: cartItems } = useCart();

  console.log(cartItems); 
  const handleAddToCart = () => {
    if (product) {
      addToCartMutation.mutate(
        { productId: product.id, quantity },
        {
          onSuccess: () => {
            setNotificationColor('teal');
            setNotificationMessage('Product added to cart successfully');
            setShowNotification(true);
          },
          onError: (error) => {
            setNotificationColor('red');
            setNotificationMessage('An error occurred while adding to cart');
            setShowNotification(true);
          },
        }
      );
    }
  };

  const handleDeleteCartItem = () => {
    if (product) {
      const cartItem = cartItems?.cart.find(item => (item.product as unknown as IProduct).id === product.id);
      if (cartItem) {
        const cartItemId = cartItem.id; 
        deleteCartItemMutation.mutate(cartItemId, {
          onSuccess: () => {
            setNotificationColor('teal');
            setNotificationMessage('Продукт удален из корзины успешно');
            setShowNotification(true);
            setTimeout(() => navigate("/"), 3000);
          },
          onError: (error) => {
            setNotificationColor('red');
            setNotificationMessage('Ошибка пройзошло во время удаления продукта');
            setShowNotification(true);
          },
        });
      }
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    dispatch(setSelectedCategory(categoryId));
    navigate("/");
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const handleRelatedProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  if (isProductLoading) {
    return (
      <Container>
        <Group justify="center" mt="xl">
          <Loader size="xl" />
          <Text>Загрузка данных...</Text>
        </Group>
      </Container>
    );
  }

  if (isProductError) {
    return (
      <Container>
        <Text c="red" ta="center" size="xl">
          Error loading product details
        </Text>
        <Text ta="center" mt="md">
          {(productError as Error)?.message || "An unknown error occurred"}
        </Text>
        <Group justify="center" mt="xl">
          <Button onClick={handleBackClick}>Вернуться к продуктам</Button>
        </Group>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container>
        <Text c="red" ta="center" size="xl">
          Продукт не найден
        </Text>
        <Group justify="center" mt="xl">
          <Button onClick={handleBackClick}>Back to Products</Button>
        </Group>
      </Container>
    );
  }

  const categoryName =
    categories?.find((c) => c.id === product.category)?.name || "Unknown Category";
  const relatedProducts = relatedProductsData?.items.filter(
    (item: IProduct) => item.id !== product.id
  );

  return (
    <Container size="xl" mt="xl">
      {showNotification && (
        <Notification
          icon={addToCartMutation.isSuccess || deleteCartItemMutation.isSuccess ? <IconCheck /> : <IconX />}
          color={notificationColor}
          title={addToCartMutation.isSuccess || deleteCartItemMutation.isSuccess ? "Success!" : "Error!"}
          onClose={() => setShowNotification(false)}
          style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}
        >
          {notificationMessage}
        </Notification>
      )}

      <Button
        variant="outline"
        color="blue"
        onClick={handleBackClick}
        mb="lg"
      >
        Back to Products
      </Button>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="lg" padding="lg" radius="md" withBorder>
            <Card.Section>
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].image}
                  height={400}
                  fit="cover"
                  alt={product.name}
                />
              ) : (
                <Box
                  style={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Image not found</Text>
                </Box>
              )}
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            <Title order={2}>{product.name}</Title>

            <Group>
              <Badge color="blue" variant="filled" size="lg">
                {product.price.toLocaleString()} сум
              </Badge>
              {product.is_new && (
                <Badge color="green" variant="light" size="lg">
                  Новая
                </Badge>
              )}
              <Badge color="blue" variant="filled" size="lg">
                {product.amount} количество
              </Badge>
            </Group>

            <Text size="sm" c="dimmed">
              {product.description}
            </Text>

            <Group
              style={
                isMobile
                  ? { flexDirection: "column", alignItems: "flex-start" }
                  : {}
              }
            >
              <Text size="sm" fw={500}>
                Категория:
              </Text>
              <Button
                variant="light"
                color="blue"
                onClick={() => handleCategoryClick(product.category)}
              >
                {categoryName}
              </Button>
              <NumberInput
                value={quantity}
                onChange={(value) => setQuantity(value as number)}
                min={1}
                max={product.amount}
                style={{ width: "100px" }}
              />
              <Button
                variant="filled"
                color="blue"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
              >
                Добавить в корзину
              </Button>
             
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>

      <Title order={2} mt="xl">
        Related Products
      </Title>
      {isRelatedLoading ? (
        <Loader />
      ) : relatedProducts?.length ? (
        <Grid mt="md">
          {relatedProducts.map((relatedProduct) => (
            <Grid.Col span={4} key={relatedProduct.id}>
              <Card shadow="sm" padding="lg" radius="md" withBorder onClick={() => handleRelatedProductClick(relatedProduct.id)}>
                <Card.Section>
                  <Image
                    src={relatedProduct.images[0].image}
                    height={200}
                    fit="cover"
                    alt={relatedProduct.name}
                  />
                </Card.Section>
                <Text fw={500} mt="xs">
                  {relatedProduct.name}
                </Text>
                <Text size="sm" color="dimmed">
                  {relatedProduct.price.toLocaleString()} sum
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Text>No related products found.</Text>
      )}
    </Container>
  );
};
