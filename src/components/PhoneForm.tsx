// src/components/PhoneForm.tsx
import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Button, Box } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { phoneSchema } from '../schemas/auth';
import { submitPhoneNumber } from '../api/auth';

interface PhoneFormProps {
  onSuccess: (phone: string) => void;
  onBack: () => void;
  
}

export default function PhoneForm({ onSuccess }: PhoneFormProps) {
  const form = useForm({
    validate: zodResolver(phoneSchema),
    initialValues: {
      phone: '',
    },
  });

  const requestOTPMutation = useMutation({
    mutationFn: submitPhoneNumber,
    onSuccess: () => {
      onSuccess(form.values.phone);
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    requestOTPMutation.mutate(values.phone);
  });

  return (
    <Box mx="auto">
      <form onSubmit={handleSubmit}>
        <TextInput
          required
          label="Phone Number"
          placeholder="998XXXXXXXXX"
          {...form.getInputProps('phone')}
        />
        <Button type="submit" mt="sm" loading={requestOTPMutation.isPending}>
          Send OTP
        </Button>
      </form>
    </Box>
  );
}