import React, { useState } from 'react';
import { useCart, useUpdateCartItem, useDeleteCartItem, useDeleteAllCartItems } from '../api/queries';
import { useMutation } from '@tanstack/react-query';
import { Card, Image, Text, Button, Group, NumberInput, LoadingOverlay, Stack, Center, Container, Title, Modal, Radio, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/axios/axios';

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

 export const CardCreationForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [cardToken, setCardToken] = useState('');

  const createCardMutation = useMutation<
    CardCreationResponse,
    Error,
    { cardNumber: string; expiryDate: string }
  >({
    mutationFn: async (cardData) => {
      const response = await api.post(`/cards/create_card`, cardData);
      return response.data;
    }
  });

  const getVerificationCodeMutation = useMutation<
    VerificationCodeResponse,
    Error,
    { token: string }
  >({
    mutationFn: async (tokenData) => {
      const response = await api.post(`/cards/get_verify_code`, tokenData);
      return response.data;
    }
  });

  const handleCreateCard = async () => {
    try {
      const result = await createCardMutation.mutateAsync({ cardNumber, expiryDate });
      if (result.success) {
        setCardToken(result.data.card.token);
        notifications.show({
          title: 'Карта добавлена',
          message: 'Ваша карта успешно добавлена. Пожалуйста, подтвердите ее.',
          color: 'green',
        });
      } else {
        throw new Error(result.errMessage || 'Не удалось создать карту');
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Произошла ошибка при создании карты',
        color: 'red',
      });
    }
  };

  const handleGetVerificationCode = async () => {
    if (!cardToken) {
      notifications.show({
        title: 'Ошибка',
        message: 'Пожалуйста, сначала добавьте карту',
        color: 'red',
      });
      return;
    }

    try {
      const result = await getVerificationCodeMutation.mutateAsync({ token: cardToken });
      if (result.success) {
        notifications.show({
          title: 'Код подтверждения отправлен',
          message: `Код подтверждения отправлен на ${result.data.phone}. Пожалуйста, подождите ${result.data.wait / 1000} секунд перед повторным запросом.`,
          color: 'green',
        });
      } else {
        throw new Error(result.errMessage || 'Не удалось получить код подтверждения');
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Произошла ошибка при получении кода подтверждения',
        color: 'red',
      });
    }
  };

  const handleVerifyCard = async () => {
    notifications.show({
      title: 'Карта подтверждена',
      message: 'Ваша карта успешно подтверждена.',
      color: 'green',
    });
    onSuccess();
  };

  return (
    <Stack>
      <LoadingOverlay visible={createCardMutation.isPending || getVerificationCodeMutation.isPending} />
      
      <TextInput
        label="Номер карты"
        placeholder="Введите номер карты"
        value={cardNumber}
        onChange={(event) => setCardNumber(event.currentTarget.value)}
      />
      
      <TextInput
        label="Срок действия"
        placeholder="ММ/ГГ"
        value={expiryDate}
        onChange={(event) => setExpiryDate(event.currentTarget.value)}
      />
      
      <Button onClick={handleCreateCard} disabled={!cardNumber || !expiryDate}>
        Добавить карту
      </Button>
      
      {cardToken && (
        <>
          <Text>Карта успешно добавлена. Пожалуйста, подтвердите вашу карту.</Text>
          <Button onClick={handleGetVerificationCode}>
            Получить код подтверждения
          </Button>
          
          <TextInput
            label="Код подтверждения"
            placeholder="Введите код подтверждения"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.currentTarget.value)}
          />
          
          <Button onClick={handleVerifyCard} disabled={!verificationCode}>
            Подтвердить карту
          </Button>
        </>
      )}
    </Stack>
  );
};
