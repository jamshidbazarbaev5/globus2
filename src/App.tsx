import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { MantineProvider, AppShell, Container, Grid } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ProductList } from './components/ProductList';
import { CategoryList } from './components/CategoryList';
import { SearchBar } from './components/SearchBar';
import { ProductDetail } from './components/ProductDetail';
import { store } from './redux/store';
import { AuthProvider } from './context/context';
import { Login } from './components/Login';
import { Register } from './components/RegistrationForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserProfile } from './components/UserProfile';
import { Cart } from './components/Cart';
import OrderForm from './components/OrderForm';
import MyOrders from './components/MyOrder';

const queryClient = new QueryClient();

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <AppShell>
                <Container size="xl">
                  <SearchBar />
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <CategoryList />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 9 }}>
                      <Routes>
                        <Route path="/" element={<ProductList />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <UserProfile />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/cart"
                          element={
                            <ProtectedRoute>
                              <Cart />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/order" element={<OrderForm />} />
                        <Route path="/my-orders" element={<MyOrders />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Grid.Col>
                  </Grid>
                </Container>
              </AppShell>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </MantineProvider>
  );
}

export default App;