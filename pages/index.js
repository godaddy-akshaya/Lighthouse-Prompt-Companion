import React from 'react';
import { Lockup, Block } from '@ux/layout';
import { withLocaleRequired } from '@gasket/react-intl';
import PropTypes from 'prop-types';
import Head from '../components/head';
import Button from '@ux/button';
import text from '@ux/text';
import Card from '@ux/card';
import Logo from '../components/logo';
import session from '../lib/session';
import TableSelect from '../components/table-select';
import TwoColumnLayout from '../components/layout/two-column-layout';

export const IndexPage = ({ authDetails }) => {

  if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
  return (
    <><Head title='GoDaddy Lighthouse' route='home' />
      <div className='lh-container'>
        <Logo />
        <Block>
          <Lockup>
            <text.h1 style={{ 'marginBottom': '0px', 'paddingBottom': '0px' }} as='heading' text='Lighthouse' />
            <text.h3 as='title' text='Insights Platform' />
          </Lockup>
        </Block>
      </div>
      <TwoColumnLayout>
        <Card id='learn-more' stretch={true}>
          <Block>
            <text.h4 as='title' text='What is Lighthouse?' />
            <text.p as='paragraph' text='GoDaddy Lighthouse is an insights platform powered by large language models. The platform allows users throughout the company to craft, manage and evaluate prompts against any text-based data.' />
            <Button text='Learn More' design='primary' as='cta' href='https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform' />
          </Block>
        </Card>
        <Card id='try-prompt-out' className='grey-card'>
          <TableSelect />
        </Card>
      </TwoColumnLayout>
    </>
  )
};

IndexPage.propTypes = {
  authDetails: PropTypes.object,
  tables: PropTypes.array
};



export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
