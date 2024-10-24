import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Card,
  Image,
  Text,
  Group,
  Badge,
  Skeleton,
  Pagination,
  Stack,
  Title,
  Box,
  useMantineTheme,
  Button,
  Notification,
} from "@mantine/core";
import { useMediaQuery, usePagination } from "@mantine/hooks";
import { useProducts, useCategories, useAddToCart } from "../api/queries";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Link } from "react-router-dom";
import { IProduct } from "../models/models";
import { IconCheck, IconShoppingCart, IconX } from "@tabler/icons-react";

export const ProductList: React.FC = () => {
  const [page, onChange] = useState(1);
  const limit = 12;
  const searchTerm = useSelector((state: RootState) => state.search.searchTerm);
  const selectedCategoryId = useSelector(
    (state: RootState) => state.category.selectedCategory
  );
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch,
  } = useProducts(
    page,
    limit,
    searchTerm,
    selectedCategoryId > 0 ? selectedCategoryId : undefined
  );
  const { data: categories } = useCategories();
  const addToCartMutation = useAddToCart();

  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationColor, setNotificationColor] = useState("red");

  useEffect(() => {
    onChange(1);
    refetch();
  }, [selectedCategoryId, searchTerm, refetch]);
  const handleAddToCart = (product: IProduct) => {
    addToCartMutation.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setNotificationColor("teal");
          setNotificationMessage("Product added to cart successfully");
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        },
        onError: () => {
          setNotificationColor("red");
          setNotificationMessage("An error occurred while adding to cart");
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        },
      }
    );
  };

  const renderSkeleton = () => (
    <Grid>
      {[...Array(limit)].map((_, index) => (
        <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Skeleton height={160} mb="md" />
            <Skeleton height={20} mb="sm" />
            <Skeleton height={20} width="70%" />
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );

  const renderProductCard = (product: IProduct) => (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      component={Link}
      to={`/product/${product.id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        margin: "0 auto",
      }}
    >
      <Card.Section>
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].image}
            height={220}
            alt={product.name}
          />
        ) : (
          <div
            style={{
              height: 170,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text c="dimmed">Изображение отсутствует</Text>
          </div>
        )}
      </Card.Section>

      <Box style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Text
          fw={500}
          mt="md"
          mb="auto"
          lineClamp={2}
          style={{ minHeight: "3em" }}
          fz={isMobile ? "sm" : "md"}
        >
          {product.name}
        </Text>

        <Box
          mt="xs"
          mb="sm"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Group gap={2}>
            <Badge color="pink" variant="light">
              {product.price.toLocaleString()} сум
            </Badge>
            {product.is_new && <Badge color="green">новая</Badge>}
          </Group>

          <Button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart(product);
            }}
            mt="lg"
        
            style={{
              background: `linear-gradient(135deg, ${theme.colors.teal[6]} 0%, ${theme.colors.green[6]} 100%)`,
              color: theme.white,
              border: "none",
            }}
          ><IconShoppingCart size={16} /></Button>
        </Box>
      </Box>
    </Card>
  );

  const renderProductGrid = () => (
    <Grid>
      {productsData?.items.map((product) => (
        <Grid.Col key={product.id} span={{ base:14, sm: 4, md: 4, lg: 3.8 }}>
          {renderProductCard(product)}
        </Grid.Col>
      ))}
    </Grid>
  );

  const renderPagination = () => {
    if (!productsData || productsData.totalPages <= 1) return null;

    return (
      <Group justify="center" mt="xl">
        <Pagination
          value={page}
          onChange={onChange}
          total={productsData.totalPages}
          size={isMobile ? "sm" : "md"}
          siblings={1}
          defaultValue={10}
        />
      </Group>
    );
  };

  return (
    <Container size="xl" mt="xl" px={isMobile ? "xs" : "md"}>
      {showNotification && (
        <Notification
          icon={notificationColor === "teal" ? <IconCheck /> : <IconX />}
          color={notificationColor}
          title={notificationColor === "teal" ? "Success!" : "Error!"}
          onClose={() => setShowNotification(false)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          {notificationMessage}
        </Notification>
      )}

      <Title order={2} mb="lg" size={isMobile ? "h3" : "h2"}>
        {selectedCategoryId > 0
          ? `Продукты в категории ${
              categories?.find((c) => c.id === selectedCategoryId)?.name || ""
            }`
          : "Все продукты"}
        {searchTerm && ` - Результаты поиска по "${searchTerm}"`}
      </Title>

      {productsLoading ? (
        renderSkeleton()
      ) : productsData?.items && productsData?.items.length > 0 ? (
        <>
          {renderProductGrid()}
          {productsData.items &&
            productsData.items.length > 10 &&
            renderPagination()}
        </>
      ) : (
        <Text ta="center" fz={isMobile ? "md" : "lg"} mt="xl">
          В этой категории нет продуктов. Попробуйте выбрать другую категорию.
        </Text>
      )}
    </Container>
  );
};
