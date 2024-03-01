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
import SummaryPrompt from '../../components/summary-prompt';
import { submitSummaryPromptJob } from '../../lib/api';
import Button from '@ux/button';
import DownloadButton from '../../components/download-button';
import { BannerMessage } from '../../components/banner-message';


const ViewPage = ({ authDetails }) => {
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    const [tableLoading, setTableLoading] = useState(true);
    const router = useRouter();
    const [data, setData] = useState();
    const [isSummaryPromptOpen, setIsSummaryPromptOpen] = useState(false);
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [userMessage, setUserMessage] = useState('');
    const [userMessageType, setUserMessageType] = useState('info');
    const [routeParams, setRouteParams] = useState({
        run_id: decodeURIComponent(router.query?.id?.[0] || '0')
    });


    const columns = [{
        column_name: 'conversation_summary',
        column_dislay_name: 'LLM Response',
    }, {
        column_name: 'prompt_template_text',
        column_dislay_name: 'Prompt Template Text'
    },
    {
        column_name: 'evaluation_summary',
        column_dislay_name: 'Evaluation Summary'
    },
    {
        column_name: 'evaluation_prompt_text',
        column_dislay_name: 'Evaluation Prompt Text'
    },
    {
        column_name: 'interaction_id',
        column_dislay_name: 'Interaction ID'
    }, {
        column_name: 'routing_report_region_2',
        column_dislay_name: 'Routing Report Region 2'
    }, {
        column_name: 'customer_type_name',
        column_dislay_name: 'Customer Type Name'
    },

    {
        column_name: 'handled_repeat_contact_platform',
        column_dislay_name: 'Handled Repeat Contact Platform'
    }, {
        column_name: 'css_score',
        column_dislay_name: 'CSS Score'
    }, {
        column_name: 'nps_score',
        column_dislay_name: 'NPS Score'
    },
    {
        column_name: 'interaction_duration',
        column_dislay_name: 'Interaction Duration'
    },
    {
        column_name: 'run_id',
        column_dislay_name: 'Run ID'
    }];
    const handleCancelSummaryPrompt = () => {
        setIsSummaryPromptOpen(false);
    }
    const handleSubmitSummaryPrompt = (formData) => {
        submitSummaryPromptJob(formData).then((data) => {
            setIsSummaryPromptOpen(false);
            if (data?.error) {
                setUserMessage(data.error);
                setUserMessageType('error');
                setShowUserMessage(true);
                return;
            } else {
                setUserMessage('Summary Prompt Job Submitted Successfully');
                setUserMessageType('success');
                setShowUserMessage(true);
            }
        });
    };
    const handleCloseError = () => {
        setShowUserMessage(false);
    }
    useEffect(() => {
        setTableLoading(true);
        getResultsByRunId(routeParams.run_id).then((data) => {
            let headers = data?.shift();
            headers = [...headers?.Data?.map((header) => header?.VarCharValue)];

            let dataSet = data.map((value, index) => {
                let obj = {};
                headers?.forEach((header, index) => {
                    obj[header] = value?.Data[index]?.VarCharValue;
                });
                return obj;
            });
            setData(dataSet);
            setTableLoading(false);
        })
    }, []);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            {showUserMessage &&
                <BannerMessage showMessage={showUserMessage} message={userMessage} userMessageType={userMessageType} handleCloseError={handleCloseError} />
            }
            <text.h3 text='View Results' as='heading' />
            <div className='lh-container lh-b'>
                <div>
                    <text.span text={`Run Id: ${routeParams.run_id}`} as='caption' />
                </div>
                <div>
                    {!tableLoading > 0 &&
                        <SiblingSet gap={'sm'}>
                            <SummaryPrompt runId={routeParams.run_id} count={data?.length || 0} isModalOpen={isSummaryPromptOpen} eventOpen={() => setIsSummaryPromptOpen(true)} eventCancel={handleCancelSummaryPrompt} eventSave={handleSubmitSummaryPrompt} />
                            <Button href={`/summary/${routeParams.run_id}`} text='Summary Responses' as='external' />

                            {/* <DownloadButton data={data} filename={`run_id_${routeParams.run_id}.csv`} /> */}
                        </SiblingSet>
                    }
                </div>
            </div>
            <Card id='evaluation' className='m-t-1 lh-view-card' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                <Table className='table table-hover lh-table-full-view-with-scroll' order={columns.map(col => col.column_name)}>
                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} column={column.column_name}>{column.column_dislay_name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data && <>
                            {!tableLoading && data?.map((item, dataIndex) => (
                                <tr key={`c-${dataIndex}`}>
                                    {columns.map((column, index) => (
                                        <td key={index} column={column.column_name}>{item[column.column_name]}</td>
                                    ))}
                                </tr>
                            ))} </>}
                    </tbody>
                </Table>
                <div className='lh-container lh-center'>
                    <div className='text-center'>
                        {data?.length === 0 && <text.p text='No records found' />}
                        {data?.length > 0 && <div>{data.length}</div>}
                        {tableLoading && <>
                            <Spinner />
                            <text.p text='Please be patient while we retrieve your results.' />
                        </>}
                    </div>
                </div>

            </Card>
        </>
    )
};
ViewPage.propTypes = {
    authDetails: PropTypes.object
};
export default ViewPage;