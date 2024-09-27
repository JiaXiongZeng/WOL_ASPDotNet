import React from 'react';
import { createRoot } from 'react-dom/client';
import { HostApp } from '@components/HostApp';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HostApp />
    </React.StrictMode>
)