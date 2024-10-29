import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  LoadingOverlay,
  Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/context';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      phone: '',
      password: '',
    },
    validate: {
      phone: (value) => (/^998\d{9}$/.test(value) ? null : 'Неверный формат номера телефона'),
      password: (value) => (value.length > 0 ? null : 'Требуется пароль'),
    },
  });

  const handleSubmit = async (values: { phone: string; password: string }) => {
    setIsLoading(true);
    try {
      await login(values.phone, values.password);
      notifications.show({
        title: 'Успешно',
        message: 'Вы успешно вошли в систему',
        color: 'green',
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.errMessage || 'Не удалось войти. Пожалуйста, проверьте свои данные и попробуйте снова.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Paper 
        radius="md" 
        p="xl" 
        withBorder 
        style={{ 
          position: 'relative',
          width: '100%',
          maxWidth: 400
        }}
      >
        <LoadingOverlay visible={isLoading} />
        <Title order={2} mb="md">С возвращением</Title>
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            required
            label="Телефон"
            placeholder="998 90 123 45 67"
            {...form.getInputProps('phone')}
          />
          <PasswordInput
            required
            label="Пароль"
            placeholder="Ваш пароль"
            mt="md"
            {...form.getInputProps('password')}
          />
          <Button fullWidth mt="xl" type="submit" loading={isLoading}>
            Войти
          </Button>
        </form>

        <Text mt="md" size="sm">
          Нет аккаунта?{' '}
          <Text component="a" href="/register" fw={700}>
            Зарегистрироваться
          </Text>
        </Text>
        <Text mt="md" size="sm">
          Хотите вернуться на главную страницу?{' '}
          <Text component="a" href="/" fw={700}>
            Назад к продуктам
          </Text>
        </Text>
      </Paper>
    </Box>
  );
};
