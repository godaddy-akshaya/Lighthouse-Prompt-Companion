import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { withLocaleRequired } from '@gasket/react-intl';
import Head from '../components/head';
import '@ux/text-input/styles';
import Card from '@ux/card';
import Button from '@ux/button';
import Tag from '@ux/tag';
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
import Copy from '@ux/icon/copy';
import { getStatus, cancelJob } from '../lib/api';
import '@ux/search/styles';
import { copyToClipBoard } from '../lib/utils';


const copyButton = (text) => {
    copyToClipBoard(text);
}

export const RunStatusPage = ({ authDetails }) => {
    const router = useRouter();
    // tag for new records created from job submission
    const { newJob } = router.query;
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState();
    const [results, setResults] = useState();
    const [tableLoading, setTableLoading] = useState(true);
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);

    //page notes
    // valid status = Submitted/In Progress/Completed/Cancelled
    /*
        cancel link will be enabled only for IP and Submitted
        View results link will be enabled only for Completed
    */
    // 
    useEffect(() => {
        getStatus().then((data) => {
            setResults(data);
            setTableLoading(false);
        })
    }, []);
    const actions = (
        <>
            <Button design='primary' aria-label='Yes' onClick={() => confrimedJobCancel()} text='Yes' />
            <Button design='secondary' aria-label='No' onClick={() => abortCancel(false)} text='No' />
        </>
    );
    const CancelButton = (job) => (
        <>
            <Button size='small' design='secondary' text='Cancel' onClick={() => confirmCancelModal(job)} />
        </>
    )
    const confirmCancelModal = (job) => {
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
                setShowModal(false);
                setModalData();
                getStatus().then((data) => setResults(data))
            });
        }
    }

    const ViewButton = (job) => (
        <Button size='small' design='secondary' aria-label='View Results' text='View Results' onClick={() => view(job)} />
    )

    const view = (job) => {
        router.push(`/view/${job.run_id}`);
    }
    return (
        <>
            {showModal && <Modal id='cancel-confirm' actions={actions} title='Cancel Confirmation'>
                <text.p text={`Are you sure you want to cancel the job?`} />
                <text.label as='label' text={`Run ID: ${modalData?.run_id}`} />
            </Modal>
            }
            <Head title='Run Status' route='status' />
            <Block as='stack' orientation='vertical'>



                <div className='lh-container lh-between m-b-1'>
                    <Lockup >
                        <text.h3 text={'Run Status'} as='heading' />
                    </Lockup>
                    <Lockup></Lockup>
                    {/* <Search
                        id='my-search'
                        style={{ 'width': '25%' }}
                        placeholder='Search for Run ID....'
                    /> */}
                </div>
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
                                        {/* <th column='query'>Query</th> */}
                                        <th column='status'>{'Status'}</th>
                                        <th column='action'>{'Action'}</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {results?.length == 0 && <tr><td colSpan='6'>No records found</td></tr>}
                                    {results?.map((item, index) => (
                                        <tr key={item.run_id}>
                                            <td column='run_id'> {item.run_id}
                                                <Button size='small' aria-label='Copy Run ID' id={`c${index}`} display='inline' onClick={() => copyButton(item.run_id)} icon={<Copy />} />
                                                {newJob == item.run_id && <>
                                                    <Tag type='success' design='filled'>New </Tag>
                                                </>}</td>
                                            <td column='run_date'>{item.run_date}</td>
                                            <td column='last_updated_time'>{item.last_updated_time}</td>
                                            <td column='user_id'>{item.user_id}</td>
                                            {/* <td column='query'>{item.query}    <Button size='small' aria-label='Copy Run ID' id={`c${index}`} display='inline' onClick={() => copyButton(item.query)} icon={<Copy />} /></td> */}
                                            <td column='status'>{item.status}</td>
                                            <td column='action'>{item.action === 'cancel' ? CancelButton(item) : item.action == 'view' ? ViewButton(item) : null}</td>
                                        </tr>
                                    )) || null}
                                </tbody>
                            </Table>
                        }
                    </Module>
                </Card>
            </Block>
        </>
    )
};

export default withLocaleRequired('/locales', { initialProps: true })(RunStatusPage);
