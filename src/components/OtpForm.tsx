// src/components/OTPForm.tsx
import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Button, Box, Group } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { otpSchema } from '../schemas/auth';
import { verifyOTP } from '../api/auth';

interface OTPFormProps {
  phoneNumber: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OTPForm({ phoneNumber, onSuccess, onBack }: OTPFormProps) {
  const form = useForm({
    validate: zodResolver(otpSchema),
    initialValues: {
      otp: '',
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: (otp: string) => verifyOTP(phoneNumber, otp),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    verifyOTPMutation.mutate(values.otp);
  });

  return (
    <Box mx="auto">
      <form onSubmit={handleSubmit}>
        <TextInput
          required
          label="OTP"
          placeholder="Enter 6-digit OTP"
          {...form.getInputProps('otp')}
        />
        <Group mt="sm">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
            <Button type="submit" loading={verifyOTPMutation.isPending}>
            Verify OTP
          </Button>
        </Group>
      </form>
    </Box>
  );
}