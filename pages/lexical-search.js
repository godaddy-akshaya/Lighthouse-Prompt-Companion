import React, { useState } from 'react';
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
import Click from '@ux/icon/click';
import example1 from '../lib/lexical-search/example-2.json';
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
  onClear, onFormat, onExample
}) => {
  return (
    <div className='lh-container lh-between'>
      <text.label visualSize='sm' as='label' text='Query (json)' />
      <SiblingSet className='push-right' gap='sm' size='sm'>
        <Button size='sm' onClick={onClear} design='inline' text='Clear' icon={<Refresh />} />
        <Button size='sm' onClick={onExample} design='inline' text='Example' icon={<Click />} />
        <Button size='sm' onClick={onFormat} design='inline' text='Format' icon={<Wand />} />
      </SiblingSet>
    </div>

  )
}

const LexicalSearch = () => {
  const formRef = useRef(null);
  const [formModel, setFormModel] = useState({
    query_name: '',
    query: '',
    queryPlaceholder: '{{"query": {"bool": {"must": [{"match": {"field": "value"}}]}}}}',
    validated: false,
    hasErrors: false,
    errorMessage: ''
  });


  const handleUseExample = (e) => {
    setFormModel({
      ...formModel,
      query: JSON.stringify(example1, null, 6)
    });
  };
  const handleClear = () => {
    setFormModel({ ...formModel, query: '' });
  };
  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(formModel.query), null, 6);
      setFormModel({ ...formModel, query: formatted, hasErrors: false, errorMessage: '' });
    } catch (e) {
      console.log('error parsing json',);
      setFormModel({ ...formModel, hasErrors: true, errorMessage: e.toString() });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formModel.validated) return;
    if (!formModel.query_name) return setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query Name is required' });
    submitLexicalQuery(formModel).then((response) => {
      console.log(response);
      setFormModel({ ...formModel, hasErrors: false, errorMessage: '' });
    }).catch((error) => {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: error });
    });
  }
  const handleValidate = (e) => {
    e.preventDefault();
    if (!formModel.query) return setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query is required' });
    validateLexicalQuery(formModel.query).then((response) => {
      console.log(response);
      setFormModel({ ...formModel, validated: true, hasErrors: false, errorMessage: '' });
    }).catch((error) => {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: error });
    });

  };
  const handleQueryInput = (e) => {
    setFormModel({
      ...formModel, query: e, validated: false
    });

  };
  const handleCloseError = () => {
    setFormModel({ ...formModel, hasErrors: false, errorMessage: '' });
  };
  return (
    <>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <Box>
        <text.h1 as='heading' text={`Lexical Query`} />
        <text.p as='paragraph' text={headerText} />
      </Box>
      <div className='lexical-query-page-layout'>
        <div className='main-column' id='json-data' gap='lg'>
          <BannerMessage showMessage={formModel.hasErrors} message={formModel.errorMessage}
            actions={<Button design="inline" text="Action Link" handleCloseError={handleCloseError} />} userMessageType='error' />
          <form ref={formRef} onSubmit={handleSubmit} id='lexical-form'>
            <Box blockPadding='md'>
              <TextInput id='name' required label='Name' value={formModel.query_name} onChange={(e) => setFormModel({ ...formModel, query_name: e })} />
            </Box>
            <Box stretch blockPadding='md'>
              <FlexTitleAndOptions onClear={handleClear} onFormat={handleFormat} onExample={handleUseExample} />
              <TextInput helpMessage={formModel?.validated && <Tag emphasis='success'>Great Job, json looks great. </Tag>}
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