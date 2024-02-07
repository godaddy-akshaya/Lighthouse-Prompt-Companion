import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Table from '@ux/table'
import Card from '@ux/card'
import Module from '@ux/layout'
import Button from '@ux/button'
import Tag from '@ux/tag'


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
]

export default function ViewResults({ authDetails }) {
    const router = useRouter();
    const { id } = router.query;
    const [data, setData] = useState([]);
    return (
        <div>
            <Card stretch={true} id='results' title='Results'>
                <Module>
                    {tableLoading && <text.p text='Loading...' />}
                    {!tableLoading &&
                        <Table
                            className='table table-hover'
                            sortable={true}>
                            <thead>
                                <tr>
                                    <th column='run_id' showIcon>{'Run ID'}</th>
                                    <th column='run_date'>{'Run Date'}</th>
                                    <th column='last_updated_time'>{'Last Updated Time'}</th>
                                    <th column='user_id'>{'User ID'}</th>
                                    <th column='status'>{'Status'}</th>
                                    <th column='action'>{'Action'}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {results?.length == 0 && <tr><td colSpan='6'>No records found</td></tr>}
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
            </Card>
        </div>
    )
}