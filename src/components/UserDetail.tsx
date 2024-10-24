// src/components/UserDetailsForm.tsx
import React from 'react';
import { useForm, zodResolver } from '@mantine/form';
import { TextInput, Button, Box, Group, Select, PasswordInput } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { userDetailsSchema } from '../schemas/auth';
import { registerUser } from '../api/auth';
import { log } from 'console';

interface UserDetailsFormProps {
  phoneNumber: string;
  onSuccess: () => void;
  onBack: () => void;

}

export default function UserDetailsForm({ phoneNumber, onSuccess, onBack ,}: UserDetailsFormProps) {
  const form = useForm({
    validate: zodResolver(userDetailsSchema),
    initialValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: any) => registerUser({ ...userData, phone: phoneNumber }),
    onSuccess: () => {
      onSuccess();

    },
  });   

  const handleSubmit = form.onSubmit((values) => {
    registerMutation.mutate(values);
    console.log(values);
  });


  return (
    <Box mx="auto">
      <form onSubmit={handleSubmit}>
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
        <Group mt="sm">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
            <Button type="submit" loading={registerMutation.isPending}>
            Complete Registration
          </Button>
        </Group>
      </form>
    </Box>
  );
}