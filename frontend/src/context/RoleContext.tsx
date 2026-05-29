'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Администратор' | 'Руководитель' | 'Бухгалтер' | 'HR' | 'Оператор';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  availableRoles: UserRole[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('Администратор'); // Default to Admin to show everything first

  const availableRoles: UserRole[] = [
    'Администратор',
    'Руководитель',
    'Бухгалтер',
    'HR',
    'Оператор'
  ];

  return (
    <RoleContext.Provider value={{ role, setRole, availableRoles }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
