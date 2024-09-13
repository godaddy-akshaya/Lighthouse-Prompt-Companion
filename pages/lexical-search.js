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
import Spinner from '@ux/spinner';
const headerText = `In lexical search you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;



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
  const textInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', errorType: 'error' });
  const [formModel, setFormModel] = useState({
    query_name: '',
    query: '',
    queryPlaceholder: '{{"query": {"bool": {"must": [{"match": {"field": "value"}}]}}}}',
    validated: false,
    hasErrors: false,
    errorMessage: '',
    submitted: false
  });
  const handleUseExample = (e) => {
    e.preventDefault();
    setFormModel({
      ...formModel,
      query: JSON.stringify(example1, null, 4)
    });
  };
  const handleClear = () => {
    setFormModel({ ...formModel, query: '' });
  };
  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(formModel.query), null, 4);
      setFormModel({ ...formModel, query: formatted, hasErrors: false, errorMessage: '' });
    } catch (e) {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: e.toString() });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formModel.validated) return;
    if (!formModel.query_name) return setFormModel({ ...formModel, hasErrors: true, message: 'Query Name is required' });
    if (!formModel.query) return setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query is required' });
    setLoading(true);
    submitLexicalQuery(formModel).then((response) => {
      console.log(response);
      setLoading(false);
      setBanner({ show: true, message: 'Query submitted successfully', type: 'success' });
      setFormModel({ ...formModel, hasErrors: false, errorMessage: '', submitted: true });
    }).catch((error) => {
      setLoading(false);

      setFormModel({ ...formModel, hasErrors: true, errorMessage: JSON.stringify(error), submitted: false });
    });
  }

  const handleValidate = (e) => {
    e.preventDefault();
    if (!formModel.query) return setBanner({ ...banner, show: true, message: 'Query is required', errorType: 'error' });
    if (!formModel.query) return setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query is required' });
    setLoading(true);
    validateLexicalQuery(formModel.query).then((response) => {
      console.log(response);
      setLoading(false);
      setBanner({ show: true, message: 'Query is valid', errorType: 'success' });
      setFormModel({ ...formModel, validated: true, hasErrors: false, errorMessage: '' });
    }).catch((error) => {
      console.log(error);
      setLoading(false);
      setBanner({ show: true, message: error?.message || 'Bad stuff occurred', errorType: 'error' });
      setFormModel({ ...formModel, hasErrors: true, errorMessage: error?.message || 'Something bad happenend', validated: false });
    });
  };
  const handleQueryInput = (e) => {
    setFormModel({
      ...formModel, query: e, validated: false
    });
  };
  const handleCloseError = (e) => {
    e.preventDefault();
    setBanner({ show: false, message: '', errorType: 'error' });
  };
  return (
    <>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <Box>
        <text.h1 as='heading' text={`Lexical Search`} />
        <text.p as='paragraph' text={headerText} />
      </Box>
      {loading && <Box>
        <Spinner size='md' />
      </Box>}
      {!loading &&
        <div className='lexical-query-page-layout'>
          <div className='main-column' id='json-data' gap='lg'>
            <BannerMessage showMessage={banner.show} message={banner.message} handleCloseError={handleCloseError}
              actions={<Button design="inline" text="Action Link" />} userMessageType={banner.errorType} />
            {!formModel.submitted &&
              <form onSubmit={handleSubmit} id='lexical-form'>
                <Box blockPadding='md'>
                  <TextInput id='name' autoComplete='off' required label='Name' value={formModel.query_name} onChange={(e) => setFormModel({ ...formModel, query_name: e })} />
                </Box>
                <Box stretch blockPadding='md'>
                  <FlexTitleAndOptions onClear={handleClear} onFormat={handleFormat} onExample={handleUseExample} />
                  <TextInput ref={textInputRef} rows={15} required resize helpMessage={formModel?.validated && <Tag emphasis='success'>Great Job, json looks great. </Tag>}
                    multiline visualSize='sm' id='json' errorMessage={formModel.errorMessage} onChange={handleQueryInput} value={formModel.query} />
                </Box>
                <Box blockPadding='lg' blockAlignChildren='end'>
                  <SiblingSet gap='sm' size='sm'>
                    <Button type='button' size='sm' design='secondary' onClick={handleValidate} text='Validate' icon={<Checkmark />} />
                    <Button type='submit' size='sm' aria-label='Validate before submit' design='primary' disabled={!formModel.validated} text='Submit' />
                  </SiblingSet>
                </Box>
              </form>
            }
            {formModel.submitted &&
              <Box blockPadding='lg'>
                <BannerMessage
                  showMessage={true}
                  message={`Query ${formModel.query_name} submitted successfully`}
                  handleCloseError={() => window.location.reload()}
                  userMessageType='success' />
              </Box>
            }
          </div>
          <div className='secondary-column'>
          </div>
        </div >
      }
    </>
  );
}

export default LexicalSearch;