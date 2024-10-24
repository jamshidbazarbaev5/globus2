import React, { useState } from 'react';
import { Modal, TextInput, Button, Group } from '@mantine/core';

interface VerificationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onVerify: (code: string) => void;
  onResendCode: () => void;
  isVerifying: boolean;
  isResending: boolean;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onRequestClose,
  onVerify,
  onResendCode,
  isVerifying,
  isResending,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(code);
  };

  return (
    <Modal opened={isOpen} onClose={onRequestClose} title="Verify Your Account">
      <form onSubmit={handleSubmit}>
        <TextInput
          required
          label="Verification Code"
          placeholder="Enter the 6-digit code"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value)}
        />
        <Group justify="apart" mt="md">
          <Button type="submit" loading={isVerifying}>
            Verify
          </Button>
          <Button variant="outline" onClick={onResendCode} loading={isResending}>
            Resend Code
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default VerificationModal;