import React, { useState, useEffect } from 'react';
import { Lockup, Block, Module } from '@ux/layout';
import { withLocaleRequired } from '@gasket/react-intl';
import Head from '../components/head';
import TextInput from '@ux/text-input';
import Add from '@ux/icon/add';
import Button from '@ux/button';
import text from '@ux/text';
import SelectInput from '@ux/select-input';
import Checkbox from '@ux/checkbox';
import Card, { spaceOptions } from '@ux/card';
import { Menu, MenuButton, MenuList, MenuItem } from '@ux/menu';
import { getGuid } from '../lib/utils';


const TABLES = [
  {
    key: 0,
    name: 'Top Level Insights',
    columns: ['css_score', 'repeat_contact_flag', 'customer_type_name', 'nps_score'],
    'css_score': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'nps_score': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'repeat_contact_flag': ['TRUE', 'FALSE'],
    'customer_region': ['Australia', 'Canada', 'United Kingdom', 'United States', 'India', 'China', 'Germany', 'Rest of World (RoW)'],
  }
]

export const IndexPage = () => {
  const [tables, setTables] = useState(TABLES);
  const [tableKey, setKey] = useState(99);
  const [fields, setFields] = useState([]);
  const [includeEval, setIncludeEval] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [count, setCount] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [prompt2, setPrompt2] = useState('');
  const [guid, setGuid] = useState('');
  const [numOfTransactions, setNumOfTransactions] = useState(0);


  const getTableColumns = () => tables[0]?.columns || null;
  const getTableList = () => tables || null;

  useEffect(() => {
    window.fetch('https://gheg0jyux8.execute-api.us-west-2.amazonaws.com/dev', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Authorization': 'token e2048a70-aa2a-4665-8843-8e24dba61b58'
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        return data;
      }).catch((error) => {
        console.log(error);
      });
  }, []);

  function insertAction(e) {
    let text = prompt + ` {${e}}`;
    setPrompt(text);
  }
  function insertEvalAction(e) {
    let text = prompt2 + ` {${e}}`;
    setPrompt2(text);
  }
  function handlePrompt2(e) {
    setPrompt2(e);
  }
  function handlePrompt(e) {
    setPrompt(e);
  }
  function handleNumberOfTransactionChange(e) {
    setNumOfTransactions(e);
  }
  function handleClick() {
    setShowParams(true);
    setNumOfTransactions(200);
    setCount(200);
  }
  function handleTableSelect(e) {
    setKey(e);
    setFields(getTableColumns);
  }
  function handleIncludeEval(e) {
    setIncludeEval(!includeEval);
  }
  function handleRunClick(e) {
    e.preventDefault();
    (async () => {
      const g = await getGuid();
      setGuid(g);
    })();
  }
  return (
    <div className='container'>
      <Head title='Prompt UI-Lighthouse' route='prompt' />
      <text.h2 as='heading' text='Prompt UI' />
      <div className='card ux-card'>
        <div className='card-block'>
          <div className="row">
            <div className='column'>
              <Block>
                <text.h4 as='title' text='Table'></text.h4>
                <Lockup>
                  <SelectInput id="tableSelection" onChange={handleTableSelect} name="select" label=''>
                    <option value="">Select Table</option>
                    {getTableList().map(table => <option key={table.key} value={table.key}>{table.name}</option>)}
                  </SelectInput>
                </Lockup>
                <Lockup className='m-t-1'>
                  {fields?.length > 0 ? <text.h4 as='title' text='Available Filters' /> : null}
                  {fields.map(field =>
                    <SelectInput id={field} name="select" multiple="true" label={field}>
                      {tables[0][field].map(value => <option key={value} value={value}>{value}</option>)}
                    </SelectInput>
                  )}
                </Lockup>
                <Lockup>
                  {fields?.length > 0 ?
                    <div className='row'>
                      <div className='column'>
                        <Button design='primary' className="m-t-1" type='button' as='cta' onClick={handleClick} text='Apply' />
                      </div>
                      <div className='column'>
                        {count > 0 ?
                          <Card id='my-card' className="m-t-1" stretch={true} space={{ inline: true, block: true, as: 'block' }}>
                            <div># of Records: {count}</div>
                          </Card> : null}
                      </div>
                    </div>
                    : null}
                </Lockup>
              </Block>
            </div>
            <div className="column">
              {showParams ?
                <>
                  <Block>
                    <text.h4 as='title' text='Parameters'></text.h4>
                    <SelectInput className='m-t-1' label='Model'>
                      <option value='Claude-instant-v1'>Claude-instant-v1</option>
                      <option value='Claude-V2'>Claude-V2</option>
                    </SelectInput>

                    <TextInput className='m-t-1' onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
                    <Menu id='my-menu' className='m-t-1'>
                      <MenuButton icon={<Add />} text='Insert' design='secondary' />
                      <MenuList design='primary'>
                        {fields.map(field => <MenuItem onSelect={insertAction}>{field}</MenuItem>)}
                        <MenuItem onSelect={insertAction}>transcript</MenuItem>
                      </MenuList>
                    </Menu>
                    <TextInput label='Prompt' className='m-t-1' name='prompt' onChange={handlePrompt} value={prompt} multiline size={3} />

                    <Card id='evaluation' className='m-t-1' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                      <Lockup orientation='vertical'>
                        <Checkbox label='Include Evaluation' onChange={handleIncludeEval} name='include' />
                      </Lockup>
                      {includeEval ?
                        <div className="eval" >
                          Evalution Parameters <br />
                          <SelectInput className='m-t-1' label='Model'>
                            <option value='Claude-instant-v1'>Claude-instant-v1</option>
                            <option value='Claude-V2'>Claude-V2</option>
                          </SelectInput>
                          <Menu id='eval-menu' className='m-t-1'>
                            <MenuButton icon={<Add />} text='Insert' design='secondary' />
                            <MenuList design='primary'>
                              {fields.map(field => <MenuItem onSelect={insertEvalAction}>{field}</MenuItem>)}
                              <MenuItem onSelect={insertAction}>transcript</MenuItem>
                            </MenuList>
                          </Menu>
                          <TextInput label='Prompt' onChange={handlePrompt2} value={prompt2} name='evalPromp' multiline size={3} />
                        </div>
                        : null}
                    </Card> <br />
                    <Button text="Run" id="run" onClick={handleRunClick} design='primary' />
                  </Block> </>
                : null}
            </div>
          </div>
        </div>
        {guid ? <div className="card-footer">
          <>Run Id: <i>{guid}</i></>
        </div> : null}
      </div>
    </div>
  )
}
export default withLocaleRequired('/locales', { initialProps: true })(IndexPage);
