import React, { useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Select,
  LoadingOverlay,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useRegister, useVerifyUser, useResendCode } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import VerificationModal from './VerificationModal';
import { log } from 'console';

const registrationSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^998\d{9}$/, 'Phone must start with 998 followed by 9 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  date_of_birth: z.date(),
  gender: z.enum(['male', 'female']),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export const Register: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const verifyUserMutation = useVerifyUser();
  const resendCodeMutation = useResendCode();

  const form = useForm<RegistrationForm>({
    validate: zodResolver(registrationSchema),
    initialValues: {
      first_name: '',
      last_name: '',  
      phone: '',
      password: '',
      confirm_password: '',
      date_of_birth: new Date(),
      gender: 'male',
    },
  });

  const handleSubmit = async (values: RegistrationForm) => {
    try {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth.toISOString().split('T')[0],
      };
      const { confirm_password, ...registrationData } = payload;
      console.log(payload);
      
      const response = await registerMutation.mutateAsync(registrationData);
      if (response.success) {
        setPhone(values.phone.replace(/\s+/g, '')); 
        setUserId(response.data.user.id);
        notifications.show({
          title: 'Success',
          message: 'Registration successful. Please enter the verification code.',
          color: 'green',
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.errMessage || 'Registration failed');
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Registration failed. Please try again.',
        color: 'red',
      });
    }
  };
  const handleVerification = async (code: string) => {
    try {
      // Validate the code format
      if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
        notifications.show({
          title: 'Error',
          message: 'Please enter a valid 6-digit code',
          color: 'red',
        });
        return;
      }
  
      // Make sure we have the phone number
      if (!phone) {
        notifications.show({
          title: 'Error',
          message: 'Phone number is missing. Please try registering again.',
          color: 'red',
        });
        return;
      }
  
      // Pass both phone and code to the mutation
      const response = await verifyUserMutation.mutateAsync({
        phone: phone.replace(/\s+/g, ''), // Remove any spaces
        code
      });
  
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Account verified successfully.',
          color: 'green',
        });
  
        if (response.data?.token) {
          localStorage.setItem('accessToken', response.data.token.access);
          localStorage.setItem('refreshToken', response.data.token.refresh);
        }
  
        setIsModalOpen(false);
        navigate('/login');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Verification failed. Please try again.';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
  
      // If user not found, close modal and redirect to registration
      if (errorMessage.includes('User not found')) {
        setIsModalOpen(false);
        navigate('/register');
      }
  
      console.error('Verification error:', {
        error,
        message: error.message,
        response: error.response?.data
      });
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await resendCodeMutation.mutateAsync({ phone });
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Verification code resent successfully.',
          color: 'green',
        });
      } else {
        throw new Error(response.errMessage || 'Failed to resend code');
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to resend code. Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <Paper radius="md" p="xl" withBorder style={{ position: 'relative', maxWidth: 400, margin: 'auto' }}>
      <LoadingOverlay visible={registerMutation.isPending} />
      <Title order={2} mb="md">Create an account</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          required
          label="First Name"
          placeholder="Your first name"
          {...form.getInputProps('first_name')}
        />
        <TextInput
          required
          label="Last Name"
          placeholder="Your last name"
          mt="md"
          {...form.getInputProps('last_name')}
        />
        <TextInput
          required
          label="Phone"
          placeholder="998 90 123 45 67"
          mt="md"
          {...form.getInputProps('phone')}
        />
        <PasswordInput
          required
          label="Password"
          placeholder="Your password"
          mt="md"
          {...form.getInputProps('password')}
        />
        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Confirm your password"
          mt="md"
          {...form.getInputProps('confirm_password')}
        />
        <DatePickerInput
          required
          label="Date of Birth"
          placeholder="Your date of birth"
          mt="md"
          {...form.getInputProps('date_of_birth')}
        />
        <Select
          required
          label="Gender"
          placeholder="Select your gender"
          data={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
          mt="md"
          {...form.getInputProps('gender')}
        />
        <Button fullWidth mt="xl" type="submit" loading={registerMutation.isPending}>
          Register
        </Button>
      </form>

      {userId !== undefined && (
        <VerificationModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          onVerify={handleVerification}
          onResendCode={handleResendCode}
          isVerifying={verifyUserMutation.isPending}
          isResending={resendCodeMutation.isPending}
        />
      )}

      <Text mt="md" size="sm">
        Already have an account?{' '}
        <Text component="a" href="/login" fw={700}>
          Login
        </Text>
      </Text>
    </Paper>
  );
};