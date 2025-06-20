import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import session from '../../lib/session.js';
import Head from '../../components/head';
import Table from '@ux/table-legacy';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import text from '@ux/text';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import { getSummaryResultsByRunId } from '../../lib/data/data.service';
import { BannerMessage } from '../../components/banner-message';
import { toTitleCase } from '../../lib/utils';

const SummaryPage = ({ authDetails }) => {
  const router = useRouter();
  const [routerParams, setRouterParams] = useState({ run_id: decodeURIComponent(router.query?.id[0] || '0') });
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [userMessageType, setUserMessageType] = useState('info');
  const handleCloseError = () => setShowUserMessage(false);

  const [tableData, setTableData] = useState({ headers: [], data: [] });

  useEffect(() => {
    if (!routerParams) return;

    setTableLoading(true);

    getSummaryResultsByRunId(routerParams.run_id)
      .then((data) => {
        if (data?.length > 0) {

          const _headers = [...data?.shift().Data?.map((header) => header?.VarCharValue)];
          const newHeaders = [..._headers];
          const newData = data.map((value, index) => {
            const obj = {};
            newHeaders?.forEach((header, index) => {
              obj[header] = value?.Data[index]?.VarCharValue || '';
            });
            return obj;
          });
          setTableData({ headers: _headers, data: newData });
        }
      })
      .catch((error) => {
        setUserMessage(error.toString());
        setUserMessageType('error');
        setShowUserMessage(true);
      }).finally(() => setTableLoading(false));

  }, [routerParams]);

  return (
    <>
      <Head title='GoDaddy Lighthouse - Summaries' route='status' />
      <BannerMessage showMessage={showUserMessage} message={userMessage} userMessageType={userMessageType} handleCloseError={handleCloseError} />
      <div className='lh-container lh-b'>
        <div>
          <text.h3 text='Summaries' as='heading' />
        </div>
        <div>
          <SiblingSet gap={'sm'}>
            <Button href={`/view/${routerParams.run_id}`} as='external' text='Go Back to Results' />
          </SiblingSet>
        </div>
      </div>
      <Card id='view-summary-card' className='m-t-1 lh-view-card' stretch title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
        {tableLoading &&
          <div className='lh-container lh-center'>
            <Spinner size='md' />
          </div>}

        <Table className='table table-hover lh-table-full-view-with-scroll'>
          {tableData.headers && <thead>
            <tr>
              {tableData.headers.map((column, index) => (
                <th key={index} column={column}>{toTitleCase(column)}</th>
              ))}
            </tr>
          </thead>
          }
          {tableData.data &&
            <tbody>
              {tableData.data && <>
                {!tableLoading && tableData?.data.map((item, dataIndex) => (
                  <tr key={`c-${dataIndex}`}>
                    {tableData.headers.map((column, index) => (
                      <td key={index} column={column}>{item[column]}</td>
                    ))}
                  </tr>
                ))} </>}
            </tbody>
          }
        </Table>

        {
          tableData.data?.length == 0 &&
          <div className='lh-container lh-center'> <text.label text='No data available' /></div>
        }
      </Card>
    </>
  );
};

SummaryPage.propTypes = {
  authDetails: PropTypes.object
};

export default SummaryPage;
