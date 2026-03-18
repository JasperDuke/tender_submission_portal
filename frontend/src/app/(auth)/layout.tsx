'use client';

import React from 'react';
import AuthPageControls from '@/components/auth/AuthPageControls';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthPageControls />
      {children}
    </>
  );
}
