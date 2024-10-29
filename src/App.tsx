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
import { AuthProvider, useAuth } from './context/context';
import { Login } from './components/Login';
import { Register } from './components/RegistrationForm';
import { UserProfile } from './components/UserProfile';
import { Cart } from './components/Cart';
import OrderForm from './components/OrderForm';
import MyOrders from './components/MyOrder';

const queryClient = new QueryClient();

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <SearchBar />
    <Grid>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <CategoryList />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 9 }}>
        {children}
      </Grid.Col>
    </Grid>
  </>
);

const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    {children}
  </div>
);

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <AppShell>
      <Container size="xl">
        <Routes>
          <Route path="/login" element={
            <SimpleLayout>
              <Login />
            </SimpleLayout>
          } />
          <Route path="/register" element={
            <SimpleLayout>
              <Register />
            </SimpleLayout>
          } />

          <Route path="/" element={
            <MainLayout>
              <ProductList />
            </MainLayout>
          } />
          
          <Route path="/product/:id" element={
            <MainLayout>
              <ProductDetail />
            </MainLayout>
          } />

          {isAuthenticated ? (
            <>
              <Route path="/profile" element={
                <MainLayout>
                  <UserProfile />
                </MainLayout>
              } />
              <Route path="/cart" element={
                <MainLayout>
                  <Cart />
                </MainLayout>
              } />
              <Route path="/order" element={
                <MainLayout>
                  <OrderForm />
                </MainLayout>
              } />
              <Route path="/my-orders" element={
                <MainLayout>
                  <MyOrders />
                </MainLayout>
              } />
            </>
          ) : null}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </AppShell>
  );
}

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </MantineProvider>
  );
}

export default App;