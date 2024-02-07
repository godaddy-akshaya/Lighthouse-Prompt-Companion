import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import session from '../../lib/session'
import Head from '../../components/head'
import { getResultsByRunId } from '../../lib/api'
import Table from '@ux/table'
import Card from '@ux/card'
import { Module } from '@ux/layout'
import Button from '@ux/button'
import Tag from '@ux/tag'
import text from '@ux/text'



const ViewPage = ({ authDetails }) => {
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    const [tableLoading, setTableLoading] = useState(true);
    const router = useRouter();
    const [data, setData] = useState();
    const [routeParams, setRouteParams] = useState({
        run_id: decodeURIComponent(router.query?.id?.[0] || '0')
    });
    const columnList = [
        "conversation_summary",
        "prompt_template_text",
        "interaction_id",
        "routing_report_region_2",
        "customer_type_name",
        "handled_repeat_contact_platform",
        "css_score",
        "nps_score",
        "run_id"
    ];

    useEffect(() => {
        console.log(routeParams.run_id);
        getResultsByRunId(routeParams.run_id).then(data => {
            console.log(data);

        })

    }, []);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Results' route='status' />
            <Card id='evaluation' className='m-t-1' stretch='true' title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                <Module>
                    <Table data={data} className='table table-hover'>
                        <thead>
                            <tr>
                                {columnList.map((column) => column.replaceAll('_', ' ')).map((column, index) => (
                                    <th key={index} column={column} showIcon>{column}</th>
                                ))}
                            </tr>

                        </thead>
                    </Table>
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
}
ViewPage.propTypes = {
    authDetails: PropTypes.object
};
export default ViewPage;