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
import { validateLexicalQuery, submitLexicalQuery, getAllLexicalQueries, deleteLexicalQuery, getLexicalQueryHits } from '../lib/api';
import Wand from '@ux/icon/wand';
import Refresh from '@ux/icon/refresh';
import { BannerMessage } from '../components/banner-message';
import Spinner from '@ux/spinner';
import DeleteQuery from '../components/lexical-search/delete-query';
import LexicalMenu from '../components/lexical-search/lexical-menu';
import ConfirmModal from '../components/confirm-modal';
import StatCard from '../components/stat-card';


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
const LexicalSearch = ({ initialQueries }) => {
  const textInputRef = useRef();
  const [lexicalHits, setLexicalHits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', errorType: 'error' });
  const [lexicalQueries, setLexicalQueries] = useState(initialQueries);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    queryId: ''
  });
  const [formModel, setFormModel] = useState({
    query_name: '',
    query: '',
    queryPlaceholder: '',
    description: '',
    validated: false,
    hasErrors: false,
    errorMessage: '',
    submitted: false,
    formMessage: '',
    isEdit: false,
    status: ''
  });

  useEffect(() => {
    getAllLexicalQueries().then((queries) => {
      try {
        let data = queries?.map((d) => {
          return {
            query_name: d.query_name,
            query: d.query,
            description: d.description
          }
        }) || [];
        setLexicalQueries(data);
      } catch (e) {
        setLexicalQueries([]);
      }
    });
  }, []);

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
      setFormModel({ ...formModel, query: e.data, isEdit: false, query_name: 'Example Query', description: 'This is an example query', validated: false });
    } else if (e.type === 'new') {
      setFormModel({ ...formModel, query: '', isEdit: false, query_name: '', description: '', validated: false });
    } else {
      setFormModel({ ...formModel, isEdit: true, query_name: e.data.query_name, query: e.data.query, description: e.data?.description || null, validated: false });

    }
  };
  const handleClear = () => {
    setFormModel({ ...formModel, query: '' });
  };
  const handleError = ({ error }) => {
    setBanner({ ...banner, show: true, message: error?.toString(), errorType: 'error' });
    setFormModel({ ...formModel, hasErrors: true, errorMessage: error?.toString(), formMessage: '' });
  }
  const handleFormat = (queryModel) => {
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
            setBanner({ ...banner, show: false, message: '', errorType: 'success' });
            setFormModel({ ...formModel, submitted: true, status: 'Saved' });
          }
        } catch (e) {
          handleError({ error: 'Issue with validation, please reach out to support' });
        }
      }).catch((error) => {
        handleError({ 'error': error?.toString() || 'Need to research this one!' });
      });
  }
  const handleCheckHits = async (e) => {
    if (!handleValidation()) return;
    setLoading(true);
    try {
      const res = await getLexicalQueryHits(formModel.query);
    } catch (error) {
      handleError({ error: error?.toString() || 'Need to research this one!' });
    };
  };
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
            setTimeout(() => {
              setBanner({ ...banner, show: false, message: '', errorType: 'error' });
            }, 3000);
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
  }
  const handleCloseError = (e) => {
    setBanner({ show: false, message: '', errorType: 'error' });
  };

  const handleDelete = () => {
    const { queryId } = confirmModal;
    deleteLexicalQuery(queryId).then((data) => {
      if (data) {
        let lex = [...lexicalQueries];
        let index = lex.findIndex((d) => d.query_name === formModel.query_name);
        lex.splice(index, 1);
        setLexicalQueries(lex);
        setConfirmModal({ ...confirmModal, show: false, queryId: '' });
        setFormModel({ ...formModel, query: '', query_name: '', description: '', validated: false, submitted: false, isEdit: false });
        setBanner({ ...banner, show: true, message: 'Query deleted', errorType: 'success' });
        setTimeout(() => {
          setBanner({ ...banner, show: false, message: '', errorType: 'error' });
        }, 2000);
      }
    });
  }
  return (
    <div className='container'>
      <Head title='Lexical Search' description='Lexical Search' route='search' />
      <text.h1 as='heading' text={`Lexical Search`} />
      <text.p as='paragraph' text={headerText} />
      {confirmModal.show && <ConfirmModal onConfirm={handleDelete} message='Are you sure' onCancel={() => setConfirmModal({ ...confirmModal, show: false })} title='Delete Query' />}
      <BannerMessage showMessage={banner.show} message={banner.message} handleCloseError={handleCloseError}
        actions={<Button design="inline" text="Action Link" />} userMessageType={banner.errorType} />
      {formModel.submitted &&
        <Box blockPadding='lg'>
          <BannerMessage
            showMessage={true}
            message={`${formModel.query_name} ${formModel.status} `}
            handleCloseError={() => window.location.reload()}
            userMessageType='success' />
        </Box>
      }
      {loading &&
        <Box>
          <Spinner size='md' />
        </Box>}
      {!loading && !formModel.submitted &&
        <>
          <form onSubmit={handleSubmit} id='lexical-form'>
            <Box className='lh-container lh-end'>
              {lexicalQueries && <LexicalMenu onAction={handleMenuAction} queries={lexicalQueries} />}
              {!lexicalQueries && <Spinner size='sm' />}
            </Box>
            <Box blockPadding='md'>
              <TextInput id='name' autoComplete='off' required label='Name' value={formModel.query_name} onChange={(e) => setFormModel({ ...formModel, query_name: e, isEdit: false })} />
            </Box>
            <Box blockPadding='md'>
              <TextInput id='description' multiline rows={2} resize label='Description' value={formModel.description} onChange={(e) => setFormModel({ ...formModel, description: e })} />

            </Box>
            <Box stretch blockPadding='md'>
              <FlexTitleAndOptions label='Query (json)' onClear={handleClear} onFormat={handleFormat} />
              <TextInput ref={textInputRef} rows={15} required resize
                multiline visualSize='sm' id='json' errorMessage={formModel.errorMessage} helpMessage={formModel.formMessage} onChange={handleQueryInput} value={formModel.query} />

            </Box>
            <Box gap='md' blockPadding='md' stretch>
              <StatCard title='Hits' value={806948} subtitle='Total Hits' />
              <StatCard title='' value={625678} subtitle='Messaging Hits' />
              <StatCard title='Speech Hits' value={181270} subtitle=' Hits' />
            </Box>
            <Box className='lh-container lh-between' stretch >

              <SiblingSet stretch gap='sm' >
                <Button type='button' size='sm' design='secondary' onClick={handleCheckHits} text='Query Hits' />
                <Button type='button' size='sm' design='secondary' onClick={handleValidate} text='Validate' icon={<Checkmark />} />
                <Button type='submit' size='sm' aria-label='Validate before submit' design='primary' disabled={!formModel.validated} text='Submit' />
              </SiblingSet>
              <Box stretch style={{ 'textAlign': 'right' }}>
                {formModel.isEdit &&
                  <DeleteQuery queryId={formModel.query_name} onDelete={(queryId) => setConfirmModal({ ...confirmModal, show: true, queryId })} />
                }
              </Box>
            </Box>
          </form>
        </>
      }
    </div>
  );
}




export default LexicalSearch;


