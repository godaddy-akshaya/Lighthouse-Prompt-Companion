import React, { useEffect, useState } from 'react';
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
import { validateLexicalQuery, submitLexicalQuery, getAllLexicalQueries } from '../lib/api';
import Wand from '@ux/icon/wand';
import Refresh from '@ux/icon/refresh';
import { BannerMessage } from '../components/banner-message';
import Spinner from '@ux/spinner';
import DeleteQuery from '../components/lexical-search/delete-query';
import LexicalMenu from '../components/lexical-search/lexical-menu';


const headerText = `In lexical search you typically use the bool query to combine multiple 
conditions using must, should, and must_not.`;

const FlexTitleAndOptions = ({
  onClear, onFormat, label
}) => {
  return (
    <div className='lh-container lh-between'>
      <text.label as='label' text={label} />
      <SiblingSet className='push-right' gap='sm'>
        <Button size='sm' onClick={onClear} design='inline' text='Clear' icon={<Refresh />} />
        <Button size='sm' onClick={onFormat} design='inline' text='Format' icon={<Wand />} />
      </SiblingSet>
    </div>
  )
}
const LexicalSearch = () => {
  const textInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', errorType: 'error' });
  const [lexicalQueries, setLexicalQueries] = useState([]);
  const [formModel, setFormModel] = useState({
    query_name: '',
    query: '',
    queryPlaceholder: '',
    validated: false,
    hasErrors: false,
    errorMessage: '',
    submitted: false,
    formMessage: ''
  });
  const handleValidation = () => {
    if (!formModel.query) {
      setBanner({ ...banner, show: true, message: 'Query is required', errorType: 'error' });
      setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Query is required' });
      return false;
    }
    if (!formModel.query_name) {
      setBanner({ ...banner, show: true, message: 'Name is required', errorType: 'error' });
      setFormModel({ ...formModel, hasErrors: true, errorMessage: 'Name is required' });
      return false;
    }
    return true;
  };
  const handleMenuAction = (e) => {
    console.log(e);
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
    setFormModel({ ...formModel, hasErrors: true, errorMessage: error?.toString(), formMessage: '' });
  }
  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(formModel.query), null, 4);
      setFormModel({ ...formModel, query: formatted, hasErrors: false, errorMessage: '', formMessage: 'Query formatted' });
    }
    catch (e) {
      setFormModel({ ...formModel, hasErrors: true, errorMessage: e.toString(), formMessage: '' });
    }
  };
  const handleSubmit = (e) => {
    if (!formModel.validated) return;
    if (!handleValidation()) return;
    setLoading(true);
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
    if (!handleValidation()) return;
    setLoading(true);
    try {
      validateLexicalQuery(formModel.query)
        .then((response) => {
          setLoading(false);
          try {
            setFormModel({ ...formModel, validated: true, hasErrors: false, errorMessage: '', formMessage: 'Query is valid' });
            setBanner({ ...banner, show: true, message: 'Query is valid', errorType: 'success' });
          } catch (error) {
            handleError({ error: response });
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

  const handleCloseError = (e) => {
    setBanner({ show: false, message: '', errorType: 'error' });
  };

  const handleDelete = (e) => {
    let lex = [...lexicalQueries];
    let index = lex.findIndex((d) => d.query_name === formModel.query_name);
    lex.splice(index, 1);
    setLexicalQueries(lex);
    setFormModel({ ...formModel, query: '', query_name: '', validated: false, submitted: false });

  }
  useEffect(() => {
    getAllLexicalQueries().then((queries) => {
      try {
        let data = queries?.map((d) => {
          return {
            query_name: d.query_name,
            query: ensureJSONString(d.query)
          }
        }) || [];
        setLexicalQueries(data);
      } catch (e) {
        setLexicalQueries([]);
      }
    });
  }, []);

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
            <Box>
              <LexicalMenu onAction={handleMenuAction} queries={lexicalQueries} />
            </Box>
            <Box blockPadding='md'>
              <TextInput id='name' autoComplete='off' required label='Name' value={formModel.query_name} onChange={(e) => setFormModel({ ...formModel, query_name: e })} />
            </Box>
            <Box stretch blockPadding='md'>
              <FlexTitleAndOptions label='Query (json)' onClear={handleClear} onFormat={handleFormat} />
              <TextInput ref={textInputRef} rows={15} required resize
                multiline visualSize='sm' id='json' errorMessage={formModel.errorMessage} helpMessage={formModel.formMessage} onChange={handleQueryInput} value={formModel.query} />
            </Box>
            <Box stretch blockPadding='lg' orientation='horizontal' inlineAlignChildren='spaceBetween'>
              <SiblingSet gap='sm' stretch>
                <Button type='button' size='sm' design='secondary' onClick={handleValidate} text='Validate' icon={<Checkmark />} />
                <Button type='submit' size='sm' aria-label='Validate before submit' design='primary' disabled={!formModel.validated} text='Submit' />
              </SiblingSet>
              <SiblingSet gap='sm' stretch>
                <DeleteQuery queryId={formModel.query_name} onDelete={handleDelete} />
              </SiblingSet>
            </Box>
          </form>
        </>
      }
    </div>
  );
}
export default withLocaleRequired('/locales', { initialProps: true })(LexicalSearch);
