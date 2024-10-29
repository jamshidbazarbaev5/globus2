import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Button, Box, Group, Select, Alert, PasswordInput } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { registerUser } from '../api/auth';
import { UserRegistrationData, UserRegistrationResponse } from '../api/types/auth';
import { IconAlertCircle } from '@tabler/icons-react';

const schema = z.object({
  first_name: z.string().min(2, 'First name should have at least 2 characters'),
  last_name: z.string().min(2, 'Last name should have at least 2 characters'),
  phone: z.string().regex(/^998\d{9}$/, 'Phone number must be in the format 998XXXXXXXXX'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  gender: z.enum(['male', 'female']),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  password_confirm: z.string().min(8, 'Password must be at least 8 characters long'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

interface UserRegistrationFormProps {
  onSuccess: (phone: string) => void;
}

export default function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const form = useForm<UserRegistrationData>({
    validate: zodResolver(schema),
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      password: '',
      password_confirm: '',
    },
  });

  const mutation = useMutation<UserRegistrationResponse, Error, Omit<UserRegistrationData, 'password_confirm'>>({
    mutationFn: async (data) => {
      const response = await registerUser(data);
      return response;
    },
    onSuccess: () => {
      onSuccess(form.values.phone);
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    const { password_confirm, ...registrationData } = values;
    mutation.mutate(registrationData);
  });

  return (
    <Box mx="auto">
      <form onSubmit={handleSubmit}>
        {mutation.isError && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mb="md">
            {mutation.error instanceof Error ? mutation.error.message : 'An unknown error occurred'}
          </Alert>
        )}
        <TextInput
          required
          label="First Name"
          placeholder="Enter your first name"
          {...form.getInputProps('first_name')}
        />
        <TextInput
          required
          label="Last Name"
          placeholder="Enter your last name"
          {...form.getInputProps('last_name')}
        />
        <TextInput
          required
          label="Phone Number"
          placeholder="998XXXXXXXXX"
          {...form.getInputProps('phone')}
        />
        <PasswordInput
          required
          label="Password"
          placeholder="Enter your password"
          {...form.getInputProps('password')}
        />
        <PasswordInput
          required
          label="Confirm Password"
          placeholder="Confirm your password"
          {...form.getInputProps('password_confirm')}
        />
        <TextInput
          required
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
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
          {...form.getInputProps('gender')}
        />
        <Group mt="md">
          <Button type="submit" loading={mutation.isPending}>
            Register
          </Button>
        </Group>
      </form>
    </Box>
  );
}