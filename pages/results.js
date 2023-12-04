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
    const data = [];
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
                                        <th column='parentContactID' showIcon>{'Parent Contact ID'}</th>
                                        <th>{'Prompt Response'}</th>
                                        <th>{'Customer Type'}</th>
                                        <th>{'Has Refund'}</th>
                                        <th>{'Call Date'}</th>
                                        <th>{'Top Level Topic'}</th>
                                        <th>{'Evaluation Model'}</th>
                                        <th>{'Evaluation Response'}</th>
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
