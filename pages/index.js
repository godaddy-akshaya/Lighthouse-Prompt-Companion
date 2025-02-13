import React from 'react';
import { withLocaleRequired } from '@gasket/react-intl';
import PropTypes from 'prop-types';
import Head from '../components/head';
import Box from '@ux/box';
import Button from '@ux/button';
import text from '@ux/text';
import Card from '@ux/card';
import TextLockup from '@ux/text-lockup';
import Logo from '../components/logo';
import session from '../lib/session';
import TableSelect from '../components/table-select';
import TwoColumnLayout from '../components/layout/two-column-layout';

export const IndexPage = ({ authDetails }) => {
  if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
  return (
    <>
      <Head title='GoDaddy Lighthouse' route='home' />
      <Box orientation='horizontal' blockPadding='md' inlinePadding='md'>
        <Logo />
        <TextLockup size='2xl' title='Lighthouse'>
          Insights Platform
        </TextLockup>
      </Box>
      <TwoColumnLayout>
        <Card id='learn-more'>
          <Box orientation='vertical' blockPadding='lg' inlinePadding='lg'>
            <text.h4 as='title' text='What is Lighthouse?' />
            <text.p as='paragraph' text='GoDaddy Lighthouse is an insights platform powered by large language models. The platform allows users throughout the company to craft, manage and evaluate prompts against any text-based data.' />
            <Box inlineAlignChildren='start'>
              <Button design='secondary' text='Learn More' as='cta' href='https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform' />
            </Box>
          </Box>
        </Card>
        <Card id='get-started'>
          <Box orientation='vertical' blockPadding='lg' inlinePadding='lg'>
            <text.h4 as='title' text='Get Started' />
            <text.p as='paragraph' text='To get this party started, select a table from the list below' />
            <TableSelect />
          </Box>
        </Card>
      </TwoColumnLayout>
    </>
  );
};

IndexPage.propTypes = {
  authDetails: PropTypes.object,
  tables: PropTypes.array
};
export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
