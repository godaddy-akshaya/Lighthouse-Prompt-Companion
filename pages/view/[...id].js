import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import session from '../../lib/session'
import Head from '../../components/head'
import Table from '@ux/table'
import Card from '@ux/card'
import Module from '@ux/layout'
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
    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            <Card stretch={true} id='results' title='Results'>
                <Module>
                    {tableLoading && <text.p text='Loading...' />}
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

export default ViewPage;