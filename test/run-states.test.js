import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RunStatusPage from '../pages/run-status';

describe('RunStatusPage', () => {
    test('renders without crashing', () => {
        render(<RunStatusPage />);
    });

    test('renders page title', () => {
        render(<RunStatusPage />);
        const pageTitle = screen.getByText('Run Status');
        expect(pageTitle).toBeInTheDocument();
    });

    test('renders Cancel Confirmation modal on Cancel button click', () => {
        render(<RunStatusPage />);
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        const modalTitle = screen.getByText('Cancel Confirmation');
        expect(modalTitle).toBeInTheDocument();
    });

    test('renders Results card', () => {
        render(<RunStatusPage />);
        const resultsCard = screen.getByText('Results');
        expect(resultsCard).toBeInTheDocument();
    });

    test('renders Loading text when table is loading', () => {
        render(<RunStatusPage />);
        const loadingText = screen.getByText('Loading...');
        expect(loadingText).toBeInTheDocument();
    });
});