import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { withLocaleRequired } from '@gasket/react-intl';
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
import Refresh from '@ux/icon/refresh';
import { BannerMessage } from '../components/banner-message';
import Spinner from '@ux/spinner';
import LexicalMenu from '../components/lexical-search/lexical-menu';


const headerText = `In lexical search you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const FlexTitleAndOptions = ({
  onClear, onFormat
}) => {
  return (
    <div className='lh-container lh-between'>
      <text.label as='label' text='Query (json)' />
      <SiblingSet className='push-right' gap='sm'>
        <Button size='sm' onClick={onClear} design='inline' text='Clear' icon={<Refresh />} />
        <Button size='sm' onClick={onFormat} design='inline' text='Format' icon={<Wand />} />
      </SiblingSet>
    </div>
  )
}
const LexicalSearch = () => {
  const textInputRef = useRef();
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ show: false, message: '', errorType: 'error' });
  const [formModel, setFormModel] = useState({
    query_name: '',
    query: '',
    queryPlaceholder: '',
    validated: false,
    hasErrors: false,
    errorMessage: '',
    submitted: false
  });
  const handleValidation = () => {
    if (!formModel.query) {
      setBanner({ ...banner, show: true, message: 'Query is required', errorType: 'error' });
      setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query is required' });
      return false;
    }
    return true;
  };
  const handleMenuAction = (e) => {
    if (e.type === 'example') {
      setFormModel({ ...formModel, query: e.data, query_name: 'Example Query', validated: false });
    }
    if (e.type === 'load') {
      setFormModel({ ...formModel, query_name: e.data.query_name, query: e.data.query, validated: false });
      handleFormat(e.data);
    }
  };
  const handleClear = () => {
    setFormModel({ ...formModel, query: '' });
  };
  const handleError = ({ error }) => {
    setBanner({ ...banner, show: true, message: error?.toString(), errorType: 'error' });
    setFormModel({ ...formModel, hasErrors: true, errorMessage: error?.toString() });
  }
  const handleFormat = (query) => {
    try {
      if (query?.query) {
        const formatted = JSON.stringify(JSON.parse(query.query), null, 4);
        setFormModel({ ...formModel, query: formatted, query_name: query.query_name, hasErrors: false, errorMessage: '' });
      } else {
        const formatted = JSON.stringify(JSON.parse(formModel.query), null, 4);
        setFormModel({ ...formModel, query: formatted, hasErrors: false, errorMessage: '' });
      }
    } catch (e) {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: e.toString() });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formModel.validated) return;
    if (!handleValidation()) return;
    setLoading(true);
    setFormModel({ ...formModel, hasErrors: false, errorMessage: '' });
    setBanner({ ...banner, show: false, message: '', errorType: 'error' });

    submitLexicalQuery(formModel)
      .then((response) => {
        setLoading(false);
        try {
          if (response.toString().includes('Error')) {
            handleError({ error: response.toString() });
          } else {
            setFormModel({ ...formModel, submitted: true });
          }
        } catch (e) {
          handleError({ error: 'Issue with validation, please reach out to support' });
        }
      }).catch((error) => {
        handleError({ 'error': error?.toString() || 'Need to research this one!' });
      });
  }

  const handleValidate = (e) => {
    e.preventDefault();
    if (!handleValidation()) return;
    setLoading(true);
    setFormModel({ ...formModel, hasErrors: false, errorMessage: '' });
    setBanner({ ...banner, show: false, message: '', errorType: 'error' });
    try {
      validateLexicalQuery(formModel.query)
        .then((response) => {

          if (response.toString().includes('Error')) {
            handleError({ error: response });
          } else {
            setLoading(false);
            setFormModel({ ...formModel, validated: true, hasErrors: false, errorMessage: '' });
            setBanner({ ...banner, show: true, message: 'Query is valid', errorType: 'success' });
          }
        });
    } catch (error) {
      handleError({ 'error': error?.toString() || 'Need to research this one!' });
    };
  };
  const handleQueryInput = (e) => {
    setFormModel({
      ...formModel, query: e, validated: false
    });
  };
  useEffect(() => {
    setLoading(false);
  }, []);
  const handleCloseError = (e) => {
    setBanner({ show: false, message: '', errorType: 'error' });
  };
  return (
    <div className='container'>
      {formModel.submitted &&
        <Box blockPadding='lg'>
          <BannerMessage
            showMessage={true}
            message={`${formModel.query_name} submitted successfully`}
            handleCloseError={() => window.location.reload()}
            userMessageType='success' />
        </Box>
      }

      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <text.h1 as='heading' text={`Lexical Search`} />
      <text.p as='paragraph' text={headerText} />
      <BannerMessage showMessage={banner.show} message={banner.message} handleCloseError={handleCloseError}
        actions={<Button design="inline" text="Action Link" />} userMessageType={banner.errorType} />
      {loading &&
        <Box>
          <Spinner size='md' />
        </Box>}
      {!loading && !formModel.submitted &&
        <>
          <form onSubmit={handleSubmit} id='lexical-form'>
            <Box displayType='box' inlineAlignSelf='end' orientation='horizontal' blockPadding='sm' stretch>
              <LexicalMenu onAction={handleMenuAction} />
            </Box>
            <Box blockPadding='md'>
              <TextInput id='name' autoComplete='off' required label='Name' value={formModel.query_name} onChange={(e) => setFormModel({ ...formModel, query_name: e })} />
            </Box>
            <Box stretch blockPadding='md'>
              <FlexTitleAndOptions onClear={handleClear} onFormat={handleFormat} />
              <TextInput ref={textInputRef} rows={15} required resize
                multiline visualSize='sm' id='json' errorMessage={formModel.errorMessage} onChange={handleQueryInput} value={formModel.query} />
            </Box>
            <Box blockPadding='lg' blockAlignChildren='end'>
              <SiblingSet gap='sm'>
                <Button type='button' size='sm' design='secondary' onClick={handleValidate} text='Validate' icon={<Checkmark />} />
                <Button type='submit' size='sm' aria-label='Validate before submit' design='primary' disabled={!formModel.validated} text='Submit' />
              </SiblingSet>
            </Box>
          </form>
        </>
      }
    </div>
  );
}
export default withLocaleRequired('/locales', { initialProps: true })(LexicalSearch);
