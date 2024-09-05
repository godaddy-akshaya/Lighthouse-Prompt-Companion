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
import Table, { Thead, Tbody, Tfoot, Th, Td, Tr, SortableHeader } from '@ux/table';
import '@ux/table/styles';
import example from '../lib/lexical-search/example-2.json'
import dynamic from 'next/dynamic';

const QueryBoolEditor = dynamic(() => import('../components/query-bool-editor'), { ssr: false });

const headerText = `In OpenSearch, you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const otherText = `For matching phrases with a 
specific distance between words, you use the match_phrase query with the slop parameter.
must: All conditions must be true (AND logic).
should: At least one of the conditions must be true (OR logic).
must_not: None of the conditions should be true (NOT logic).`;

const LexicalSearch = () => {
  const [isClient, setIsClient] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [field, setField] = useState('');
  const [clause, setClause] = useState('must');
  const [type, setType] = useState('match');
  const [queryType, setQueryType] = useState('match_phrase');
  const [queryText, setQueryText] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    console.log(example);
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

        <Box orientation='horizontal' blockAlignChildren='start' >

          <Card id='criteria-input'>
            <Box gap='md' blockPadding='md'>
              <SiblingSet stretch gap='sm' size='sm'>

                <SelectInput
                  visualSize='sm'
                  id='clause'
                  label='Clause'
                  value={clause}
                  onChange={(e) => setClause(e)}
                >
                  <option value='must'>must</option>
                  <option value='should'>should</option>
                  <option value='must_not'>must_not</option>
                </SelectInput>
                <SelectInput
                  visualSize='sm'
                  id='queryType'
                  label='Query Type'
                  value={queryType}
                  onChange={(e) => setQueryType(e)}
                >
                  <option value='match_phrase'>match_phrase</option>
                </SelectInput>
                <SelectInput
                  visualSize='sm'
                  id='query'
                  label='Query'
                  value={query}
                  onChange={(e) => setQuery(e)}
                >
                  <option value='customer_conversation'>customer_conversation</option>
                  <option value='agent_conversation'>agent_conversation</option>
                </SelectInput>
                <TextInput style={{ 'minWidth': '250px', 'width': '100%' }} visualSize='sm' id='queryText' label='Text' value={queryText} onChange={(e) => setQueryText(e)} />
                <Button id='add' design='inline' text='Add' onClick={addCriteria} />
              </SiblingSet>
            </Box>
          </Card>
          <Box>
            <Table className='example' density='sm'>
              <Thead>
                <Tr>
                  <Th scope='col'>Person</Th>
                  <Th scope='col'>Interest</Th>
                  <Th scope='col'>UID</Th>
                  <Th scope='col'>Age</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Th scope='row'>Chris</Th>
                  <Td>HTML tables</Td>
                  <Td>12345</Td>
                  <Td>33</Td>
                </Tr>
                <Tr>
                  <Th scope='row'>Amanda</Th>
                  <Td>React</Td>
                  <Td>12345</Td>
                  <Td>33</Td>
                </Tr>
                <Tr>
                  <Th scope='row'>Sarah</Th>
                  <Td>CSS</Td>
                  <Td>12345</Td>
                  <Td>33</Td>
                </Tr>
                <Tr>
                  <Th scope='row'>Steve</Th>
                  <Td>HTML buttons</Td>
                  <Td>12345</Td>
                  <Td>33</Td>
                </Tr>
              </Tbody>
              <Tfoot>
                <Tr>
                  <Th scope='row' colSpan='3'>Average age</Th>
                  <Td>33</Td>
                </Tr>
              </Tfoot>
            </Table>

          </Box>
          <Box>
            <Card id='code'>
              <CodeBlock className='code-block-custom-styles' text={JSON.stringify(example, null, 2)} language='json' showLineNumbers={true} wrapLongLines={true} /></Card>
            {/* <Card stretch id='query-bool-editor'>
            {isClient && <QueryBoolEditor options={{ mode: 'code' }} value={buildBoolQuery()} />}
          </Card> */}
          </Box></Box>
      </Box>
    </>
  );
}

export default LexicalSearch;