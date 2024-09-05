import React, { useEffect, useState, useMemo } from 'react';
import Box from '@ux/box';
import text from '@ux/text';
import Head from '../components/head';
import dynamic from 'next/dynamic';
import SiblingSet from '@ux/sibling-set';
import Card from '@ux/card';
import Button from '@ux/button';
import TextInput from '@ux/text-input';
import SelectInput from '@ux/select-input';
import Tabs from '@ux/tabs';
import { CodeBlock, CopyBlock, Code, dracula } from 'react-code-blocks';
const QueryBoolEditor = dynamic(() => import('../components/query-bool-editor'), { ssr: false });
import * as example2 from '../lib/lexical-search/example-2.json'

const headerText = `In OpenSearch, you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const otherText = `For matching phrases with a 
specific distance between words, you use the match_phrase query with the slop parameter.
must: All conditions must be true (AND logic).
should: At least one of the conditions must be true (OR logic).
must_not: None of the conditions should be true (NOT logic).`;
function MyTabs() {
  const config = [{
    id: 'criteria',
    text: 'Criteria',
    content: 'QueryBoolEditor'
  }, {
    id: 'query',
    text: 'Query',
    content: 'Code'
  }];
  const items = useMemo(() => config, [config]);
  const [active, setActive] = useState(items[0].id);
  const id = 'my-tabs';

  return (
    <>
      {/* Tabs component */}
      <Tabs id={id} items={items} onChange={setActive} />

      {/* User provided panel */}
      <div {...Tabs.panelAttrs(id, active)}>{items.find(item => item.id === active).content}</div>
    </>
  );
}
const LexicalSearch = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <Box gap='md' space={{ block: true, inline: true }} >
        <text.h1 as='heading' text='Lexical Query' />
        <text.p as='paragraph' text={headerText} />
        <text.p as='paragraph' text={otherText} />


        <Box orientation='horizontal' space={{ block: true, inline: true }} >
          <Card id='criteria-input'>
            <SiblingSet stretch gap='sm' size='sm'>
              <TextInput visualSize='sm' id='field' label='Field' />
              <SelectInput visualSize='sm' id='operator' label='Operator' >
                <option value='must'>must</option>
                <option value='should'>should</option>
                <option value='must_not'>must_not</option>
              </SelectInput>
              <SelectInput visualSize='sm' id='type' label='Type' >
                <option value='match'>match</option>
                <option value='match_phrase'>match_phrase</option>
              </SelectInput>
              <Button id='add' display='inline' text='Add' />

            </SiblingSet>
          </Card>
          <Card id='code'>
            <Box orientation='vertical' space={{ block: true, inline: true }}>
              <CodeBlock text={JSON.stringify(example2.default)} language='javascript' showLineNumbers={true} wrapLongLines={true} />

            </Box></Card>
        </Box>
      </Box>
    </>
  );
}
export default LexicalSearch;