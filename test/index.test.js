import React from 'react';
import { render, screen } from '@testing-library/react';
import IndexPage from '../pages/index';

describe('IndexPage', () => {
    test('renders page title', () => {
        render(<IndexPage />);
        const pageTitle = screen.getByText('GoDaddy Lighthouse');
        expect(pageTitle).toBeInTheDocument();
    });

    test('renders learn more button', () => {
        render(<IndexPage />);
        const learnMoreButton = screen.getByRole('link', { name: 'Learn More' });
        expect(learnMoreButton).toBeInTheDocument();
        expect(learnMoreButton).toHaveAttribute('href', 'https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform');
    });

    test('renders table select component', () => {
        render(<IndexPage />);
        const tableSelectComponent = screen.getByTestId('table-select');
        expect(tableSelectComponent).toBeInTheDocument();
    });
});