import React, { useEffect, useState, useCallback } from 'react';
import { TextInput, Group, Button, Box, Grid } from '@mantine/core';
import { IconSearch, IconShoppingCart } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { setSearchTerm } from '../redux/searchSlice';
import debounce from 'lodash/debounce';
import { useAuth } from '../context/context';

export const SearchBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();


  const debouncedDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSearchTerm(value));
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    if (inputValue === '') {
      dispatch(setSearchTerm(''));
    } else {
      debouncedDispatch(inputValue);
    }

    return () => {
      debouncedDispatch.cancel();
    };
  }, [inputValue, debouncedDispatch, dispatch]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleUsernameClick = () => {
    if (location.pathname === '/profile') {
      navigate('/');
    } else {
      navigate('/profile');
    }
  };
  const handleMyOrdersClick = () => {
    navigate('/my-orders');
  };

  return (
    <Grid align="center" gutter="xs">
      <Grid.Col span={7.2}>
        <TextInput
          style={{ marginTop: '10px', marginBottom: '10px' }}
          placeholder="Search products..."
          leftSection={<IconSearch size={16} />}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Grid.Col>
      {isAuthenticated ? (
        <>
          <Grid.Col span={0.8}>
            <Button component={Link} to="/cart" variant="outline" fullWidth>
              <IconShoppingCart size={20} />
            </Button>
          </Grid.Col>
          <Grid.Col span={1.2}>
            <Button onClick={handleUsernameClick} variant="outline" fullWidth>
              {location.pathname === '/profile' ? 'Home' : (user?.first_name || 'Profile')}
            </Button>
          </Grid.Col>
          <Grid.Col span={1.2}>
            <Button onClick={handleLogout} color="red" fullWidth>
              Выйты
            </Button>
          </Grid.Col>
          <Grid.Col span={1.5}>
            <Button onClick={handleMyOrdersClick} variant="outline" fullWidth>
              Мои заказы
            </Button>
          </Grid.Col>
        </>
      ) : (
        <>
          <Grid.Col span={2}>
            <Button component={Link} to="/login" variant="outline" fullWidth>
              Вход
            </Button>
          </Grid.Col>
          <Grid.Col span={2}>
            <Button component={Link} to="/register" fullWidth>
              Регистрация
            </Button>
          </Grid.Col>
        </>
      )}
    </Grid>
  );
};