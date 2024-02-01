import React, { useEffect, useState } from 'react';
import { withLocaleRequired } from '@gasket/react-intl';
import Head from '../components/head';
import '@ux/text-input/styles';
import Card from '@ux/card';
import Button from '@ux/button';
import { Block, Lockup, Module } from '@ux/layout';
import '@ux/button/styles';
import text from '@ux/text';
import '@ux/select-input/styles';
import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';
import '@ux/checkbox/styles';
import Table from '@ux/table';
import '@ux/table/styles';
import Search from '@ux/search';
import session from '../lib/session';
import { getResults, cancelJob } from '../lib/api';
import '@ux/search/styles';


export const ResultsPage = ({ authDetails }) => {
    const [results, setResults] = useState([]);
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    //page notes
    // valid status = Submitted/In Progress/Completed/Cancelled
    /*
        cancel link will be enabled only for IP and Submitted
        View results link will be enabled only for Completed
    */
    // 
    const cancelButton = (job) => (
        <>
            <Button size='small' design='secondary' text='Cancel' onClick={() => cancel(job)} />
        </>
    )
    const cancel = (job) => {
        alert(`Cancelling job ${job.run_id}...`);
        cancelJob(job).then((data) => {
            console.log(data);
            if (data.error) return alert(data.error);
            alert('Job cancelled successfully');
        });
    }

    const filterResults = (searchText) => {
        console.log(searchText)
        if (searchText === '' || searchText === null) return setResults(results);
        let newResults = results.filter((item) => {
            return item.run_id.includes(searchText);
        });
        setResults(newResults);
    }

    useEffect(() => {
        //get results
        getResults().then((data) => {
            console.log(data);
            setResults(data);
        });
    }, []);

    const status = {
        Submitted: 'Submitted',
        InProgress: 'In Progress',
        Completed: 'Completed',
        Cancelled: 'Cancelled'
    }

    return (
        <>
            <Head title='Results' route='results' />
            <Block as='stack' orientation='vertical'>
                <Block orientation='horizontal'>
                    <Lockup >
                        <text.h3 text={'Results'} as='heading' />
                    </Lockup>
                </Block>

                <Card stretch={true} id='results' title='Results'>
                    <Module>
                        <Search
                            id='my-search'
                            onChange={(e) => filterResults(e)}
                            placeholder='Search for Run ID....'
                        />
                        <Table
                            className='table table-hover'
                            data={results}
                            sortable={true}>
                            <thead>
                                <tr>
                                    <th column='run_id' showIcon>{'Run ID'}</th>
                                    <th column='run_date'>{'Run Date'}</th>
                                    <th column='user_id'>{'User ID'}</th>
                                    <th column='status'>{'Status'}</th>
                                    <th column='action'>{'Action'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, index) => (
                                    <tr key={index}>
                                        <td column='run_id'>{item.run_id}</td>
                                        <td column='run_date'>{item.run_date}</td>
                                        <td column='user_id'>{item.user_id}</td>
                                        <td column='status'>{item.status}</td>
                                        <td column='action'>{item.action === 'cancel' ? cancelButton(item) : item.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Module>

                </Card>
            </Block>

        </>
    )
};

export default withLocaleRequired('/locales', { initialProps: true })(ResultsPage);
