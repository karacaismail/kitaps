import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';

export const renderWithTheme = element => render(<MantineProvider>{element}</MantineProvider>);
