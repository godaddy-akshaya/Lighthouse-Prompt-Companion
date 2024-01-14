import React, { useState, useEffect } from 'react';
import { Lockup, Block, Module } from '@ux/layout';
import { withLocaleRequired } from '@gasket/react-intl';
import Head from '../components/head';
import Button from '@ux/button';
import SelectInput from '@ux/select-input';
import text from '@ux/text';
import Card, { spaceOptions } from '@ux/card';
import Logo from '../components/logo';
import { getTables } from '../lib/api';
import SiblingSet from '@ux/sibling-set';


export const IndexPage = () => {
  const [tables, setTables] = useState();

  useEffect(() => {
    getTables().then(data => {
      console.log(data);
      setTables(data);
    });
  }, []);

  return (
    <><Head title='GoDaddy Lighthouse' route='prompt' />
      <div className='lh-container'>
        <Logo />
        <Block>
          <Lockup>
            <text.h1 style={{ 'margin-bottom': '0px', 'padding-bottom': '0px' }} as='heading' text='Lighthouse' />
            <text.h3 as='title' text='Insights Platform' />
          </Lockup>
        </Block>

      </div>
      <div className='lh-container lh-between'>
        <Block>
          <Card id='learn-more'>
            <Block orientation='horizontal' >
              <text.h4 as='title' text='What is Lighthouse?' />
              <text.p as='body' text='GoDaddy Lighthouse is an insights platform powered by large language models. The platform allows users throughout the company to craft, manage and evaluate prompts against any text-based data.' />
              <Button text='Learn More' design='primary' as='cta' href='https://godaddy-corp.atlassian.net/wiki/spaces/BI/pages/3343751333/GoDaddy+Lighthouse+-+an+Insights+Platform' />
            </Block>
          </Card>
        </Block>


        <Block>
          <Card id='try-prompt-out' className='grey-card'>
            <Block orientation='horizontal' >
              <text.h4 as='title' text='Get Started' />
              <text.p as='body' text='To get this party started, select a table from the list and select go' />
              <SiblingSet style={{ 'width': '650px' }} stretch={true} gap='sm'>
                <SelectInput stretch={true} id='tables' name='select'>
                  <option value='top-level-insights'>Top Level Insights</option>
                </SelectInput>
                <Button text='Go' design='primary' as='cta' />
              </SiblingSet>
            </Block>
          </Card>
        </Block>

      </div>



    </>
  )
};
export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
