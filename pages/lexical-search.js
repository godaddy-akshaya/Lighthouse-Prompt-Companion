import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import Box from '@ux/box';
import text from '@ux/text';
import Head from '../components/head';
import TextInput from '@ux/text-input';
import Button from '@ux/button';
import '@ux/table/styles';
import SiblingSet from '@ux/sibling-set';
import Checkmark from '@ux/icon/checkmark';
import { validateLexicalQuery, submitLexicalQuery } from '../lib/api';
import Wand from '@ux/icon/wand';
import Tag from '@ux/tag';
import ToolTip from '@ux/tooltip';
import Refresh from '@ux/icon/refresh';
import { Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuSeperator } from '@ux/menu';
import '@ux/menu/styles';
// import example1 from '../lib/lexical-search/example-1.json';
// import example2 from '../lib/lexical-search/example-2.json';
import { BannerMessage } from '../components/banner-message';
const headerText = `In lexical search you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const CriteriaToolTip = ({ title, content }) => {
  const [show, setShow] = useState(false);
  const anchorRef = useRef(null);

  const tooltip = (
    <ToolTip anchorRef={anchorRef} onClose={() => setShow(false)} id='button-hint'>
      <div>{content}</div>
    </ToolTip>
  );

  return (
    <div>
      <Button
        ref={anchorRef}
        text={title}
        design='inline'
        onClick={() => setShow(!show)}
        aria-describedby='button-hint'
      />
      {show && tooltip}
    </div>
  );
}

const FlexTitleAndOptions = ({
  onClear, onFormat
}) => {
  return (
    <div className='lh-container lh-between'>
      <text.label visualSize='sm' as='label' text='Query (json)' />
      <SiblingSet className='push-right' gap='sm' size='sm'>
        <Button size='sm' onClick={onClear} design='inline' text='Clear' icon={<Refresh />} />
        <Button size='sm' onClick={onFormat} design='inline' text='Format' icon={<Wand />} />
      </SiblingSet>
    </div>

  )
}

const LexicalSearch = () => {
  const formRef = useRef(null);
  const [formModel, setFormModel] = useState({
    name: '',
    query: '',
    queryPlaceholder: '{{"query": {"bool": {"must": [{"match": {"field": "value"}}]}}}}',
    validated: false,
    hasErrors: false,
    errorMessage: ''
  });
  const [json, setJson] = useState('');
  const [example, setExample] = useState([]);
  const handleUseExample = (e) => {
    console.log(e);
    setJson(JSON.stringify(example[e], null, 6));
  };
  const handleClear = () => {
    setFormModel({ ...formModel, query: '' });
  };
  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(formModel.query), null, 6);
      setFormModel({ ...formModel, query: formatted });
    } catch (e) {
      console.log('error parsing json');
      setFormModel({ ...formModel, hasErrors: true });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Need end point');

  }
  useEffect(() => {
    //  setExample([example1, example2]);
  }, []);
  const handleValidate = (e) => {
    console.log('do validation');
    validateLexicalQuery(formModel.query).then((response) => {
      console.log(response);
      setFormModel({ ...formModel, validated: true });
    }).catch((error) => {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: error });
    });

  };
  const handleQueryInput = (e) => {
    setFormModel({
      ...formModel, query: e, validated: false
    });

  };
  const handlePasteQuery = (e) => {

    const query = JSON.parse(e);
    setFormModel({ ...formModel, query: query });
  };

  return (
    <>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      {/* <Box gap='md' orientation='horizontal'>
        <Button icon={<Checkmark />} aria-label='Delete' />
        <Button design='primary' icon={<Checkmark />} aria-label='Save' />
        <Button design='secondary' icon={<Checkmark />} aria-label='Delete' />
      </Box> */}
      <Box>
        <text.h1 as='heading' text={`Lexical Query`} />
        <text.p as='paragraph' text={headerText} />
      </Box>
      <div className='lexical-query-page-layout'>
        <div className='main-column' id='json-data' gap='lg'>
          {formModel.hasErrors && <BannerMessage showMessage={true} message={form} userMessageType='error' />}
          <form ref={formRef} onSubmit={handleSubmit} id='lexical-form'>
            <Box blockPadding='md'>
              <TextInput id='name' label='Name' value={formModel.name} onChange={(e) => setFormModel({ ...formModel, name: e })} />

            </Box>
            <Box stretch blockPadding='md'>
              <FlexTitleAndOptions onClear={handleClear} onFormat={handleFormat} />
              <TextInput helpMessage={formModel?.validated && <Tag emphasis='success'>Validated</Tag>}
                multiline size={15} visualSize='sm' id='json' onChange={handleQueryInput} value={formModel.query} />
            </Box>

            <Box blockPadding='lg' blockAlignChildren='end'>
              <SiblingSet gap='sm' size='sm'>
                <Button type='button' size='sm' design='secondary' onClick={handleValidate} text='Validate' icon={<Checkmark />} />
                <Button type='submit' size='sm' aria-label='Validate before submit' design='primary' disabled={!formModel.validated} text='Submit' />
              </SiblingSet>
            </Box>
          </form>
        </div>
        <div className='secondary-column'>
        </div>
      </div >

    </>
  );
}

export default LexicalSearch;