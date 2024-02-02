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
import Modal from '@ux/modal';
import '@ux/modal/styles';
import '@ux/table/styles';
import Search from '@ux/search';
import session from '../lib/session';
import { getResults, cancelJob } from '../lib/api';
import '@ux/search/styles';


export const ResultsPage = ({ authDetails }) => {
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState();
    const [results, setResults] = useState();
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    //page notes
    // valid status = Submitted/In Progress/Completed/Cancelled
    /*
        cancel link will be enabled only for IP and Submitted
        View results link will be enabled only for Completed
    */
    // 
    useEffect(() => {
        getResults().then((data) => setResults(data))
    }, []);
    const actions = (
        <>
            <Button design='primary' onClick={() => confrimedJobCancel()} text='Yes' />
            <Button design='secondary' onClick={() => abortCancel(false)} text='No' />
        </>
    );
    const CancelButton = (job) => (
        <>
            <Button size='small' design='secondary' text='Cancel' onClick={() => confirmCancelModal(job)} />
        </>
    )
    const confirmCancelModal = (job) => {
        console.log('Cancel job', job);
        setModalData(job);
        setShowModal(true);
    }
    const abortCancel = () => {
        setShowModal(false);
        setModalData();
    }
    const confrimedJobCancel = () => {
        // Check if they are sure they want to cancel the job
        if (modalData) {
            cancelJob(modalData).then((data) => {
                console.log('Job cancelled', data);
                setShowModal(false);
                setModalData();
                getResults().then((data) => setResults(data))
            });
        }
    }

    const ViewButton = (job) => (
        <Button size='small' design='secondary' text='View Results' onClick={() => view(job)} />
    )

    const view = (job) => {
        alert('I don\'t know how to view the results yet');
    }

    return (
        <>
            {showModal && <Modal id='cancel-confirm' actions={actions} title='Cancel Confirmation'>
                <text.p text={`Are you sure you want to cancel the job?`} />
                <text.label as='label' text={`Run ID: ${modalData?.run_id}`} />
            </Modal>
            }
            <Head title='Results' route='results' />
            <Block as='stack' orientation='vertical'>
                <Block orientation='horizontal'>
                    <Lockup >
                        <text.h3 text={'Results'} as='heading' />
                    </Lockup>
                </Block>
                <div className='lh-container lh-between m-b-1'>
                    <Search
                        id='my-search'

                        placeholder='Search for Run ID....'
                    />
                    <text.label as='caption' text={`# of records: ${results?.length || 0}`} />
                </div>

                <Card stretch={true} id='results' title='Results'>
                    <Module>

                        {results && results.length > 0 &&
                            <Table
                                className='table table-hover'
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
                                    {results?.map((item, index) => (
                                        <tr key={item.run_id}>
                                            <td column='run_id'>{item.run_id}</td>
                                            <td column='run_date'>{item.run_date}</td>
                                            <td column='user_id'>{item.user_id}</td>
                                            <td column='status'>{item.status}</td>
                                            <td column='action'>{item.action === 'cancel' ? CancelButton(item) : item.action == 'view' ? ViewButton(item) : null}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        }
                    </Module>
                </Card>
            </Block>
        </>
    )
};

export default withLocaleRequired('/locales', { initialProps: true })(ResultsPage);
