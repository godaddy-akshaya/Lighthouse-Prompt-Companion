import React, { useState, useEffect } from 'react';
import { Lockup, Block, Module } from '@ux/layout';
import { withLocaleRequired } from '@gasket/react-intl';
import PropTypes from 'prop-types';
import Head from '../components/head';
import Button from '@ux/button';
import SelectInput from '@ux/select-input';
import text from '@ux/text';
import Spinner from '@ux/spinner';
import Card, { spaceOptions } from '@ux/card';
import Logo from '../components/logo';
import { getTables } from '../lib/api';
import session from '../lib/session';
import SiblingSet from '@ux/sibling-set';



export const IndexPage = ({ authDetails }) => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState();
  const [selectedTable, setSelectedTable] = useState();
  const [tableDisplayName, setTableDisplayName] = useState();

  if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);

  function handleTableSelect(event) {
    setSelectedTable(event);
    let display_name = tables.find(table => table.column_name === event).display_name;
    setTableDisplayName(display_name.toString());
  }

  useEffect(() => {
    getTables().then(data => {
      setTables(data);
      setLoading(false);
    });
  }, []);

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
      <div className='lh-container lh-between'>
        <Block>
          <Card id='learn-more'>
            <Block orientation='horizontal' >
              <text.h4 as='title' text='What is Lighthouse?' />
              <text.p as='paragraph' text='GoDaddy Lighthouse is an insights platform powered by large language models. The platform allows users throughout the company to craft, manage and evaluate prompts against any text-based data.' />
              <Button text='Learn More' design='primary' as='cta' href='https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform' />
            </Block>
          </Card>
        </Block>
        <Block>
          <Card id='try-prompt-out' className='grey-card'>
            <Block orientation='horizontal' >
              {loading && <Spinner />}
              {!loading && tables && tables.length === 0 && <text.p as='paragraph' text='No tables found' />}
              {!loading && tables && tables.length > 0 && <>
                <text.h4 as='title' text='Get Started' />
                <text.p as='paragraph' text='To get this party started, select a table from the list and select go' />
                <SiblingSet style={{ 'width': '650px' }} stretch={true} gap='sm'>
                  <SelectInput className='select-table' label='' stretch={true} onChange={handleTableSelect} id='tables' name='select'>
                    <option value=''>Select...</option>
                    {tables?.map(table => <option key={table.column_name} value={table.column_name}>{table.display_name}</option>) || null}
                  </SelectInput>
                  <Button text='Go' design='primary' as='cta' href={`/table/${encodeURI(selectedTable)}?display_name=${encodeURI(tableDisplayName)}`} />
                </SiblingSet>
              </>}
            </Block>
          </Card>
        </Block>
      </div>
    </>
  )
};

IndexPage.propTypes = {
  authDetails: PropTypes.object
};

export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
