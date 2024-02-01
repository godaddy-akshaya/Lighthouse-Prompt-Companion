import React from 'react';
import { withLocaleRequired } from '@gasket/react-intl';
import Head from '../components/head';
import '@ux/text-input/styles';
import Button from '@ux/button';
import '@ux/button/styles';

import '@ux/select-input/styles';
import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';
import '@ux/checkbox/styles';
import Table from '@ux/table';
import '@ux/table/styles';
import Search from '@ux/search';
import '@ux/search/styles';

export const ResultsPage = () => {
    //page notes
    // valid status = Submitted/In Progress/Completed/Cancelled
    /*
        cancel link will be enabled only for IP and Submitted
        View results link will be enabled only for Completed

    */
    // 
    const cancelButton = (run_id) => { };
    const viewResults = (run_id) => { };
    const status = {
        Submitted: 'Submitted',
        InProgress: 'In Progress',
        Completed: 'Completed',
        Cancelled: 'Cancelled'
    }
    const data = [
        { run_id: 1234, last_update_time: '6:45 AM', status: 'Submitted', action: 'cancel', view_results: 'View results' },
    ];
    return (
        <div className='container m-t-3'>
            <Head title='Results' route='results' />
            <div className='row'>
                <div className='card m-t-3 ux-card'>
                    <div className='card-block'>
                        <div className='card-title'>
                            <h1 className='p-t-2'>Results</h1>
                        </div>
                        <div class="card-title">
                            <form role='search' action=''>
                                <Search
                                    id='my-search'
                                    placeholder='Results Id'
                                />
                            </form>
                        </div>
                        <div className='card-title'><Button design='secondary'>Download</Button></div>
                        <div className='card-block'>
                            <Table
                                className='table table-hover'
                                data={data}
                                order='parentContactID'
                                sortable={true}>
                                <thead>
                                    <tr>
                                        <th column='parentContactID' showIcon>{'Run ID'}</th>
                                        <th>{'Last Update Time'}</th>
                                        <th>{'Status'}</th>
                                        <th>{'Action'}</th>
                                        <th>{'View Results'}</th>
                                    </tr>
                                </thead>
                            </Table>

                        </div>
                        <div class="card-block">


                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
};

export default withLocaleRequired('/locales', { initialProps: true })(ResultsPage);
