


import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Notification } from '@mantine/core';
import { useLogin } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import { IconCheck, IconX } from '@tabler/icons-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; color: 'green' | 'red' }>({
    show: false,
    title: '',
    message: '',
    color: 'green',
  });

  const form = useForm({
    initialValues: {
      phone: '',
      password: '',
    },
    validate: {
      phone: (value) => (/^998\d{9}$/.test(value) ? null : 'Invalid phone number format'),
      password: (value) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: { phone: string; password: string }) => {
    try {
      const response = await loginMutation.mutateAsync(values);
      localStorage.setItem('token', response.data.token.access);
      localStorage.setItem('refreshToken', response.data.token.refresh);
      setNotification({
        show: true,
        title: 'Success',
        message: 'You have successfully logged in',
        color: 'green',
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      setNotification({
        show: true,
        title: 'Error',
        message: error.response?.data?.errMessage || 'Login failed. Please check your credentials and try again.',
        color: 'red',
      });
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} mb="md">Welcome back</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          label="Phone"
          placeholder="998 90 123 45 67"
          {...form.getInputProps('phone')}
        />
        <PasswordInput
          required
          label="Password"
          placeholder="Your password"
          mt="md"
          {...form.getInputProps('password')}
        />
        <Button fullWidth mt="xl" type="submit" loading={loginMutation.isPending}>
          Sign in
        </Button>
      </form>
      <Text mt="md" size="sm">
        Don't have an account? <Text component="a" href="/register" fw={700}>Register</Text>
      </Text>
      {notification.show && (
        <Notification
          title={notification.title}
          color={notification.color}
          onClose={() => setNotification({ ...notification, show: false })}
          icon={notification.color === 'green' ? <IconCheck size="1.1rem" /> : <IconX size="1.1rem" />}
        >
          {notification.message}
        </Notification>
      )}
    </Paper>
  );
};