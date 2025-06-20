import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import session from '../../lib/session.js';
import Head from '../../components/head';
import { getResultsByRunId } from '../../lib/data/data.service.js';
import Table from '@ux/table-legacy';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import text from '@ux/text';
import SiblingSet from '@ux/sibling-set';
import SummaryPrompt from '../../components/summary-prompt';
import { submitSummaryPromptJob } from '../../lib/data/data.service';
import Button from '@ux/button';
import DownloadButton from '../../components/download-button';
import { BannerMessage } from '../../components/banner-message';

const ViewPage = ({ authDetails }) => {
  if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
  const [tableLoading, setTableLoading] = useState(true);
  const router = useRouter();
  const [data, setData] = useState({ headers: [], dataSet: [] });
  const [isSummaryPromptOpen, setIsSummaryPromptOpen] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [userMessageType, setUserMessageType] = useState('info');
  const [routeParams, setRouteParams] = useState({ run_id: '0' });



  const handleCancelSummaryPrompt = () => {
    setIsSummaryPromptOpen(false);
  };
  const handleSubmitSummaryPrompt = (formData) => {
    submitSummaryPromptJob(formData).then((data) => {
      setIsSummaryPromptOpen(false);
      if (data?.error) {
        setUserMessage(data.error);
        setUserMessageType('error');
        setShowUserMessage(true);
        return;
      }
      setUserMessage('Summary Prompt Job Submitted Successfully');
      setUserMessageType('success');
      setShowUserMessage(true);

    });
  };
  function convertToTitleCase(text) {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  const handleCloseError = () => {
    setShowUserMessage(false);
  };
  useEffect(() => {
    if (router.isReady) {
      setRouteParams({ run_id: decodeURIComponent(router.query?.id[0] || '0') });
      setTableLoading(true);
      getResultsByRunId(router.query?.id[0] || 0).then((data) => {
        let headers = data?.shift();
        headers = [...headers?.Data?.map((header) => header?.VarCharValue)];
        const dataSet = data.map((value) => {
          const obj = {};
          headers?.forEach((header, index) => {
            /* eslint-disable no-unsafe-optional-chain */
            obj[header] = value?.Data[index]?.VarCharValue;
          });
          return obj;
        });
        setData({ headers, dataSet });
        setTableLoading(false);
      });
    }

  }, [router.isReady, router.query]);

  return (
    <>
      <Head title='GoDaddy Lighthouse - Results' route='status' />
      {showUserMessage &&
        <BannerMessage showMessage={showUserMessage} message={userMessage} userMessageType={userMessageType} handleCloseError={handleCloseError} />
      }
      <text.h3 text='Results' as='heading' />
      <div className='lh-container lh-b'>
        <div>
          <text.span text={`Run Id: ${routeParams.run_id}`} as='caption' />
        </div>
        <div>
          {!tableLoading > 0 &&
            <SiblingSet gap={'sm'}>
              <SummaryPrompt runId={routeParams.run_id} count={data?.dataSet?.length || 0}
                isModalOpen={isSummaryPromptOpen} eventOpen={() => setIsSummaryPromptOpen(true)}
                eventCancel={handleCancelSummaryPrompt} eventSave={handleSubmitSummaryPrompt}
              />
              <Button href={`/summary/${routeParams.run_id}`} text='Summaries' as='external' />
              <DownloadButton data={data.dataSet} filename={`run_id_${routeParams.run_id}.csv`} />
            </SiblingSet>
          }
        </div>
      </div>
      <Card id='evaluation' className='m-t-1 lh-view-card' stretch title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
        <Table className='table table-hover lh-table-full-view-with-scroll' order={data?.headers.map(col => col)}>
          <thead>
            <tr>
              {data.headers.map((column, index) => (
                <th key={index} column={column}>{convertToTitleCase(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.dataSet && <>
              {!tableLoading && data.dataSet?.map((item, dataIndex) => (
                <tr key={`c-${dataIndex}`}>
                  {data.headers.map((column, index) => (
                    <td key={index} column={column}>{item[column]}</td>
                  ))}
                </tr>
              ))} </>}
          </tbody>
        </Table>
        <div className='lh-container lh-center'>
          <div className='text-center'>
            {data?.dataSet?.length === 0 && !tableLoading && <text.p text='No records found' />}
            {data?.dataSet?.length > 0 && <div>{data.length}</div>}
            {tableLoading && <>
              <Spinner size='md' />
              <text.p text='Please be patient while we retrieve your results.' />
            </>}
          </div>
        </div>

      </Card>
    </>
  );
};
ViewPage.propTypes = {
  authDetails: PropTypes.object
};
export default ViewPage;
