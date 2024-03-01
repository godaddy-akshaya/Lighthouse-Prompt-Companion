import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import session from '../../lib/session';
import Head from '../../components/head';
import { getResultsByRunId } from '../../lib/api';
import Table from '@ux/table';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import { Module, Block } from '@ux/layout';
import text from '@ux/text';
import Alert from '@ux/alert';
import SiblingSet from '@ux/sibling-set';
import Button from '@ux/button';
import DownloadButton from '../../components/download-button';
import { getSummaryResultsByRunId } from '../../lib/api';
import { BannerMessage } from '../../components/banner-message';


const SummaryPage = ({ authDetails }) => {
    const router = useRouter();
    const [routerParams, setRouterParams] = useState({ run_id: decodeURIComponent(router.query?.id[0] || '0') });
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [userMessage, setUserMessage] = useState('');
    const [headers, setHeaders] = useState([]);
    const [userMessageType, setUserMessageType] = useState('info');
    const handleCloseError = () => setShowUserMessage(false);

    const [tableData, setTableData] = useState({ headers: [], data: [] });

    useEffect(() => {
        if (routerParams) {
            getSummaryResultsByRunId(routerParams.run_id)
                .then((data) => {
                    let _headers = data?.shift();
                    _headers = [..._headers?.Data?.map((header) => header?.VarCharValue)];
                    let newData = data.map((value, index) => {
                        let obj = {};
                        _headers?.forEach((header, index) => {
                            obj[header] = value?.Data[index]?.VarCharValue;
                        });
                        return obj;
                    });
                    console.log('newData', newData, _headers);
                    setTableData({ headers: _headers, data: newData });
                })
                .then(() => setTableLoading(false)).catch((error) => {
                    setUserMessage(error.message);
                    setUserMessageType('error');
                    setShowUserMessage(true);
                });
        }

    }, [routerParams]);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            <BannerMessage showMessage={showUserMessage} message={userMessage} userMessageType={userMessageType} handleCloseError={handleCloseError} />
            <div className='lh-container lh-b'>
                <div>
                    <text.h3 text='View Summary' as='heading' />
                </div>
                <div>

                    <SiblingSet gap={'sm'}>
                        <Button href={`/view/${routerParams.run_id}`} as='external' text='Got Back to Results' />

                        {/* <DownloadButton data={data} filename={`run_id_${routeParams.run_id}.csv`} /> */}
                    </SiblingSet>

                </div>
            </div>
            <Card id='view-summary-card' className='m-t-1 lh-view-card' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                {tableLoading &&
                    <div className='lh-container lh-center'>
                        <Spinner />
                    </div>}

                <Table className='table table-hover lh-table-full-view-with-scroll'>
                    {tableData.headers && <thead>
                        <tr>
                            {tableData.headers.map((column, index) => (
                                <th key={index} column={column}>{column}</th>
                            ))}
                        </tr>
                    </thead>
                    }
                    {/* {tableData.data &&
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
                    } */}
                </Table>

                {
                    tableData.data?.length == 0 &&
                    <div className='lh-container lh-center'> <text.label text='No data available' /></div>

                }
            </Card>
        </>
    )
};

SummaryPage.propTypes = {
    authDetails: PropTypes.object
};

export default SummaryPage;