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
import Button from '@ux/button';
import DownloadButton from '../../components/download-button';
import { getSummaryResultsByRunId } from '../../lib/api';
import { BannerMessage } from '../../components/banner-message';



const SummaryPage = ({ authDetails }) => {
    const router = useRouter();
    const [routerParams, setRouterParams] = useState({ run_id: decodeURIComponent(router.query?.id[0] || '0') });
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [userMessage, setUserMessage] = useState('');
    const [userMessageType, setUserMessageType] = useState('info');
    const handleCloseError = () => setShowUserMessage(false);

    const [data, setData] = useState(null);

    useEffect(() => {
        if (routerParams) {
            getSummaryResultsByRunId(routerParams.run_id)
                .then((data) => setData(data))
                .then(() => setTableLoading(false)).catch((error) => {
                    setUserMessage(error.message);
                    setUserMessageType('error');
                    setShowUserMessage(true);
                });
        }

    }, [routerParams]);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            <BannerMessage showMessage={showUserMessage} message={userMessage} userMessageType={userMessageType} handleCloseError={handleCloseError} />
            <div className='lh-container lh-b'>
                <div>
                    <text.h3 text='View Summary' as='heading' />
                </div>
                <div>
                    {!tableLoading > 0 &&
                        <SiblingSet gap={'sm'}>
                            <Button href={`/view/${routerParams.run_id}`} as='external' text='Go to Results' />

                            {/* <DownloadButton data={data} filename={`run_id_${routeParams.run_id}.csv`} /> */}
                        </SiblingSet>
                    }
                </div>
            </div>
        </>
    )
};

SummaryPage.propTypes = {
    authDetails: PropTypes.object
};

export default SummaryPage;