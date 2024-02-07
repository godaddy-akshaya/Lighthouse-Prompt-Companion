import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import session from '../../lib/session';
import Head from '../../components/head';
import { getResultsByRunId } from '../../lib/api';
import Table from '@ux/table';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import { Module } from '@ux/layout';
import text from '@ux/text';



const ViewPage = ({ authDetails }) => {
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    const [tableLoading, setTableLoading] = useState(true);
    const router = useRouter();
    const [data, setData] = useState();
    const [routeParams, setRouteParams] = useState({
        run_id: decodeURIComponent(router.query?.id?.[0] || '0')
    });

    // const model = [{
    //     llm_response: 'value here',
    //     prompt_template_text: 'something here',
    //     interaction_id: 'dafa',
    //     routing_report_region_2: 'value here',
    //     customer_type_name: 'value here',
    //     handled_repeat_contact_platform: 'value here',
    //     css_score: 'value here',
    //     nps_score: 'value here',
    //     run_id: 'value here',
    // }];

    const columns = [{
        column_name: 'llm_response',
        column_dislay_name: 'LLM Response',
    }, {
        column_name: 'prompt_template_text',
        column_dislay_name: 'Prompt Template Text'
    }, {
        column_name: 'interaction_id',
        column_dislay_name: 'Interaction ID'
    }, {
        column_name: 'routing_report_region_2',
        column_dislay_name: 'Routing Report Region 2'
    }, {
        column_name: 'customer_type_name',
        column_dislay_name: 'Customer Type Name'
    }, {
        column_name: 'handled_repeat_contact_platform',
        column_dislay_name: 'Handled Repeat Contact Platform'
    }, {
        column_name: 'css_score',
        column_dislay_name: 'CSS Score'
    }, {
        column_name: 'nps_score',
        column_dislay_name: 'NPS Score'
    }, {
        column_name: 'run_id',
        column_dislay_name: 'Run ID'
    }];
    useEffect(() => {
        setTableLoading(true);
        getResultsByRunId(routeParams.run_id).then((data) => {
            console.log(data);
            setData(data);
            setTableLoading(false);
        })

    }, []);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            <Card id='evaluation' className='m-t-1' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                <Module>
                    <Table className='table table-hover'>
                        <thead>
                            <tr>
                                {columns.map((column, index) => (
                                    <th key={index} column={column.column_name}>{column.column_dislay_name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!tableLoading && data?.map((item, dataIndex) => (
                                <tr key={`c-${dataIndex}`}>
                                    {columns.map((column, index) => (
                                        <td key={index} column={column.column_name}>{item.Data[index]?.VarCharValue}</td>
                                    ))}
                                </tr>
                            ))}
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
                </Module>
            </Card>
            {/* <Card stretch={true} id='results' title='Results'>
                <Module>
                    {tableLoading && <text.p text='Loading...' />}
                    {!tableLoading &&
                        <Table
                            className='table table-hover'
                            sortable={true}>
                            <thead>
                                <tr>
                                    {columnList.map((column, index) => (
                                        <th column={column} showIcon>{column}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {/* {results?.length == 0 && <tr><td colSpan='6'>No records found</td></tr>}
                                {results?.map((item, index) => (
                                    <tr key={item.run_id}>
                                        <td column='run_id'> {item.run_id}

                                        </td>
                                        <td column='run_date'>{item.run_date}</td>
                                        <td column='last_updated_time'>{item.last_updated_time}</td>
                                        <td column='user_id'>{item.user_id}</td>
                                        <td column='status'>{item.status}</td>
                                        <td column='action'>{item.action === 'cancel' ? CancelButton(item) : item.action == 'view' ? ViewButton(item) : null}</td>
                                    </tr>
                                )) || null} 
                            </tbody>
                        </Table>
                    }
                </Module>
            </Card> */}
        </>
    )
};
ViewPage.propTypes = {
    authDetails: PropTypes.object
};
export default ViewPage;