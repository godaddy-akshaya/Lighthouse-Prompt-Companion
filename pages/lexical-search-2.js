import React, { useEffect, useState } from 'react';
import Box from '@ux/box';
import text from '@ux/text';
import Head from '../components/head';
import Card from '@ux/card';
import SiblingSet from '@ux/sibling-set';
import TextInput from '@ux/text-input';
import SelectInput from '@ux/select-input';
import Button from '@ux/button';
import { CodeBlock, CopyBlock, Code, dracula } from 'react-code-blocks';
import dynamic from 'next/dynamic';

const QueryBoolEditor = dynamic(() => import('../components/query-bool-editor'), { ssr: false });

const headerText = `In OpenSearch, you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const otherText = `For matching phrases with a 
specific distance between words, you use the match_phrase query with the slop parameter.
must: All conditions must be true (AND logic).
should: At least one of the conditions must be true (OR logic).
must_not: None of the conditions should be true (NOT logic).`;

const LexicalSearch2 = () => {
  const [isClient, setIsClient] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('must');
  const [type, setType] = useState('match');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addCriteria = () => {
    setCriteria([...criteria, { field, operator, type }]);
    setField('');
    setOperator('must');
    setType('match');
  };

  const buildBoolQuery = () => {
    const boolQuery = {
      bool: {
        must: [],
        should: [],
        must_not: []
      }
    };

    criteria.forEach(({ field, operator, type }) => {
      const query = { [type]: { [field]: '' } };
      boolQuery.bool[operator].push(query);
    });

    return boolQuery;
  };

  return (
    <>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <Box gap='md' space={{ block: true, inline: true }} >
        <text.h1 as='heading' text='Lexical Query' />
        <text.p as='paragraph' text={headerText} />
        <text.p as='paragraph' text={otherText} />

        <Box orientation='horizontal' space={{ block: true, inline: true }} >
          <Card stretch id='criteria-input'>
            <SiblingSet stretch gap='sm' size='sm'>
              <TextInput
                visualSize='sm'
                id='field'
                label='Field'
                value={field}
                onChange={(e) => setField(e)}
              />
              <SelectInput
                visualSize='sm'
                id='operator'
                label='Operator'
                value={operator}
                onChange={(e) => setOperator(e)}
              >
                <option value='must'>must</option>
                <option value='should'>should</option>
                <option value='must_not'>must_not</option>
              </SelectInput>
              <SelectInput
                visualSize='sm'
                id='type'
                label='Type'
                value={type}
                onChange={(e) => setType(e)}
              >
                <option value='match'>match</option>
                <option value='match_phrase'>match_phrase</option>
              </SelectInput>
              <Button id='add' display='inline' text='Add' onClick={addCriteria} />
            </SiblingSet>
          </Card>
          <Card stretch id='code'>
            <CodeBlock text={oldSql} language='sql' showLineNumbers={true} wrapLongLines={true} />
          </Card>
          <Card stretch id='query-bool-editor'>
            {isClient && <QueryBoolEditor options={{ mode: 'code' }} value={buildBoolQuery()} />}
          </Card>
        </Box>
      </Box>
    </>
  );
}

export default LexicalSearch2;