
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Spinner from '@ux/spinner';
import Box from '@ux/box';
import Head from '../../components/head';
import text from '@ux/text';
import Button from '@ux/button';
import Card from '@ux/card';
import TableSelect from '../../components/table-select';
import { submitRowCountRequest, getTableFilters, submitPromptJob } from '../../lib/data/data.service';
import Alert from '@ux/alert';
import session from '../../lib/session';
import { getGuid } from '../../lib/utils';
import MessageOverlay from '@ux/message-overlay';
import TableFilter from '../../components/table-filter';
import PromptForm from '../../components/prompt-form';
import TwoColumnLayout from '../../components/layout/two-column-layout';

const PromptBuilder = ({ authDetails }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [numOfTransactions, setNumOfTransactions] = useState(null);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [filters, setFilters] = useState();

  const [jobModel, setJobModel] = useState({
    prompt: '',
    evaluation: false,
    model: '',
    evaluation_model: '',
    evaluation_prompt: '',
    evaluation_provider: '',
    filterOptions: [],
    extras: []
  });
  const [errorMessage, setErrorMessage] = useState('Something went wrong');
  const router = useRouter();
  const [routeParams, setRouteParams] = useState({
    table: decodeURIComponent(router.query?.id?.[0] || '0'),
    display_name: decodeURI(router.query?.display_name) || decodeURIComponent(router.query?.id?.[0] || '0')
  });
  if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);

  function handleOnSubmit(formValues) {
    setIsLoading(true);
    (async () => {
      const g = await getGuid();
      const job = {
        count: formValues.numOfTransactionsToRun,
        run_id: g,
        prompt: formValues.prompt,
        evaluation: formValues.includeEval,
        model: formValues.promptModel,
        evaluation_model: formValues.evaluationModel || null,
        evaluation_prompt: formValues.evaluationPrompt || null
      };
      submitPromptJob(routeParams.table, job, jobModel.filterOptions, jobModel.extras).then(() => {
        router.push(`/run-status?newJob=${g}`, undefined, { shallow: true });
      }, error => {
        setErrorMessage(error);
        setIsLoading(false);
        setShowUserMessage(true);
      });
    })();
  }
  function handleCloseError(e) {
    setShowUserMessage(false);
    setErrorMessage('');
  }
  const handleError = (error) => {
    setErrorMessage(error);
    setIsLoading(false);
    setShowUserMessage(true);
    setShowMessage(false);
  };

  /*  after posting prompt form -> results page    */
  const handleTableRowSubmit = (filterOptions, extras) => {
    setIsPromptVisible(true);
    setIsPromptLoading(true);
    setShowMessage(false);
    setNumOfTransactions(null);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
    try {
      setJobModel({ ...jobModel, filterOptions, extras });
      submitRowCountRequest(routeParams.table, filterOptions, extras).then(data => {
        console.log('page', data);
        if (data?.errorMessage) {
          setNumOfTransactions(0);
          setErrorMessage(data.errorMessage);
          setShowUserMessage(true);
          setShowMessage(false);
        } else {

          setNumOfTransactions(data || 0);
          setShowMessage(false);
        }
        setIsPromptLoading(false);
      }, error => {
        setErrorMessage(error);
        setIsLoading(false);
        setShowUserMessage(true);
      });

    } catch (error) {
      handleError(error);
    }
  };
  useEffect(() => {
    if (routeParams.table === '0') {
      setShowTableSelect(true);
      setIsLoading(false);
    } else {
      getTableFilters(routeParams.table).then(data => {
        console.log('page', data.errorMessage);
        if (data?.errorMessage) {
          setErrorMessage(data.errorMessage);
          setShowUserMessage(true);
          setIsLoading(false);
          setFilters([]);
        } else
          setFilters(data);
        setShowTableSelect(false);
        setIsLoading(false);
      }).catch(error => handleError(error));
    }
  }, [routeParams]);
  return (
    <>  <Head title='Prompt Parameters' route='table' />
      {showTableSelect && <TableSelect />}
      {showUserMessage &&
        <Box>
          <Alert
            title={errorMessage}
            id='critical-message'
            emphasis="critical"
            actions={<Button design="inline" onClick={handleCloseError} text="Close" />} />
        </Box>
      }
      {isLoading &&
        <Box blockPadding='xl' inlinePadding='xl' inlineAlignChildren='center'>
          <Spinner size='md' />
        </Box>
      }
      {
        !isLoading && !showTableSelect && <>
          <Box>
            <text.h1 text={routeParams.display_name || 'missing'} as='heading' />
            <TwoColumnLayout>
              <Box>
                <TableFilter filters={filters} onSubmit={handleTableRowSubmit} />
              </Box>
              {isPromptVisible &&
                <Box stretch>
                  <text.h3 as='title' text='Parameters' />
                  {numOfTransactions > 0 &&
                    <PromptForm onSubmit={handleOnSubmit} numOfTransactions={numOfTransactions} />
                  }
                  {numOfTransactions == 0 && <Box>
                    <Card className='lh-prompt-form-card' id='para-card' stretch title='Parameters' space={{ block: 'lg', inline: 'lg' }}>
                      <text.h4 as='title' text='No Transactions Found' />
                      <text.p text='No transactions found based on your selections' />
                    </Card>
                  </Box>
                  }
                  {isPromptLoading &&
                    <Box stretch>
                      <Card className='lh-prompt-form-card' stretch id='para-card' title='Parameters'>
                        <MessageOverlay onEventBehind={handleTableRowSubmit} >
                          <Box blockPadding='lg' inlinePadding='lg' className='text-center'>
                            <text.label as='label' text='Getting number of transcripts based on your selections' />
                            <Spinner size='md' />
                          </Box>
                        </MessageOverlay>
                      </Card>
                    </Box>
                  }
                </Box>
              }
            </TwoColumnLayout>
          </Box>
        </>
      }
    </>
  );
};
export default PromptBuilder;
