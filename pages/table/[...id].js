
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Spinner from '@ux/spinner';
import { Block, Lockup, Module } from '@ux/layout';
import Head from '../../components/head';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import '@ux/icon/home/index.css';
import '@ux/text-input/styles';
import '@ux/card/styles';
import Button from '@ux/button';
import SelectInput from '@ux/select-input';
import Checkbox from '@ux/checkbox';
import '@ux/select/styles';
import '@ux/icon/add/index.css';
import '@ux/checkbox/styles';
import '@ux/field-frame/styles';
import '@ux/date-input/styles';
import Card, { spaceOptions } from '@ux/card';
import '@ux/filter/styles';
import TableSelect from '../../components/table-select';
import { submitRowCountRequest, getTableFilters, submitPromptJob } from '../../lib/api';
import Alert from '@ux/alert';
import session from '../../lib/session';
import { getGuid } from '../../lib/utils';
import MessageOverlay from '@ux/message-overlay';
import TableFilter from '../../components/table-filter';
import PromptForm from '../../components/prompt-form';
import TwoColumnLayout from '../../components/layout/two-column-layout';


const PromptBuilder = ({ authDetails }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [showMessage, setShowMessage] = useState(false);
    const [numOfTransactions, setNumOfTransactions] = useState();
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [showTableSelect, setShowTableSelect] = useState(false);
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [filters, setFilters] = useState();
    const [jobModel, setJobModel] = useState({
        prompt: '',
        evaluation: false,
        model: '',
        evaluation_model: '',
        evaluation_prompt: '',
        filterOptions: [],
        extras: []
    });
    const [errorMessage, setErrorMessage] = useState('Something went wrong');

    const router = useRouter();
    const [routeParams, setRouteParams] = useState({
        table: decodeURIComponent(router.query?.id?.[0] || '0'),
        display_name: decodeURI(router.query?.display_name) || decodeURIComponent(router.query?.id?.[0] || '0')
    });
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);

    function handleOnSubmit(formValues) {
        setIsLoading(true);
        (async () => {
            let g = await getGuid();
            let job = {
                count: formValues.numOfTransactionsToRun,
                run_id: g,
                prompt: formValues.prompt,
                evaluation: formValues.includeEval,
                model: formValues.promptModel,
                evaluation_model: formValues.evaluationModel || '',
                evaluation_prompt: formValues.evaluationPrompt || '',
            }
            submitPromptJob(routeParams.table, job, jobModel.filterOptions, jobModel.extras).then(data => {
                router.push(`/run-status?newJob=${g}`, undefined, { shallow: true });
            }, error => {
                setErrorMessage(error);
                setIsLoading(false);
                setShowUserMessage(true);
            });
        })();
    }
    function handleCloseError(e) {
        setShowUserMessage(false);
        setErrorMessage('');
    }
    /*  after posting prompt form -> results page    */
    const handleTableRowSubmit = (filterOptions, extras) => {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setJobModel({ ...jobModel, filterOptions, extras });
            setIsPromptVisible(true);
            setShowMessage(true);
            submitRowCountRequest(routeParams.table, filterOptions, extras).then(data => {
                if (data?.errorMessage) {
                    setNumOfTransactions(0);
                    setErrorMessage(data.errorMessage);
                    setShowUserMessage(true);
                    setShowMessage(false);
                } else {
                    setNumOfTransactions(data || 0);
                    setShowMessage(false);
                }
            }, error => {
                setErrorMessage(error);
                setIsLoading(false);
                setShowUserMessage(true);
            });
        } catch (error) {
            setErrorMessage(error);
            setIsLoading(false);
            setShowUserMessage(true);
        }
    }

    useEffect(() => {
        if (routeParams.table === '0') {
            setShowTableSelect(true);
            setIsLoading(false);
        } else {
            getTableFilters(routeParams.table).then(data => {
                setFilters(data);
                setShowTableSelect(false);
                setIsLoading(false);
            });
        }
    }, []);
    return (
        <>  <Head title='Prompt Parameters' route='table' />
            {showUserMessage &&
                <Block>
                    <Alert
                        title={errorMessage}
                        id='critical-message'
                        emphasis="critical"
                        actions={<Button design="inline" onClick={handleCloseError} text="Close" />} />
                </Block>
            }
            {isLoading &&
                <div className='text-center'>
                    <Spinner />
                </div>
            }
            {showTableSelect && <TableSelect />}
            {
                !isLoading && !showTableSelect && <>
                    <Block as='stack' orientation='vertical'>
                        <Lockup >
                            <text.h1 text={routeParams.display_name || 'missing'} as='heading' />
                        </Lockup>
                        <TwoColumnLayout>

                            <Block>
                                <TableFilter filters={filters} onSubmit={handleTableRowSubmit} />
                            </Block>
                            <Block>
                                <div>


                                    {isPromptVisible &&
                                        <><text.h3 as='title' text='Parameters' />
                                            {showMessage &&
                                                <Card className='lh-prompt-form-card' id='para-card' stretch={true} title='Parameters'>
                                                    <MessageOverlay onEventBehind={handleTableRowSubmit} >
                                                        <Block as='stack' className='text-center' orientation='vertical'>
                                                            <text.label as='label' text='Getting number of transcripts based on your selections' />
                                                            <br />
                                                            <Spinner />
                                                        </Block>
                                                    </MessageOverlay>
                                                </Card>
                                            }
                                            {numOfTransactions == 0 && <>
                                                <Card className='lh-prompt-form-card' id='para-card' stretch={true} title='Parameters'>
                                                    <Block>
                                                        <text.h4 as='title' text='No Transactions Found' />
                                                        <text.p text='No transactions found based on your selections' />
                                                    </Block>
                                                </Card>
                                            </>
                                            }
                                            {isPromptVisible && numOfTransactions > 0 &&

                                                <PromptForm onSubmit={handleOnSubmit} numOfTransactions={numOfTransactions} />

                                            }
                                        </>
                                    }
                                </div>
                            </Block>

                        </TwoColumnLayout>
                        {/* <div className='lh-container lh-between'>
                            <Block>
                                <TableFilter filters={filters} onSubmit={handleTableRowSubmit} />
                            </Block>
                            <Block>
                                {isPromptVisible &&
                                    <><text.h3 as='title' text='Parameters' />
                                        {showMessage &&
                                            <Card className='lh-prompt-form-card' id='para-card' stretch={true} title='Parameters'>
                                                <MessageOverlay onEventBehind={handleTableRowSubmit} >
                                                    <Block as='stack' className='text-center' orientation='vertical'>
                                                        <text.label as='label' text='Getting number of transcripts based on your selections' />
                                                        <br />
                                                        <Spinner />
                                                    </Block>
                                                </MessageOverlay>
                                            </Card>
                                        }
                                        {numOfTransactions == 0 && <>
                                            <Card className='lh-prompt-form-card' id='para-card' stretch={true} title='Parameters'>
                                                <Block>
                                                    <text.h4 as='title' text='No Transactions Found' />
                                                    <text.p text='No transactions found based on your selections' />
                                                </Block>
                                            </Card>
                                        </>
                                        }
                                        {isPromptVisible && numOfTransactions > 0 &&

                                            <PromptForm onSubmit={handleOnSubmit} numOfTransactions={numOfTransactions} />

                                        }
                                    </>
                                }
                            </Block>
                        </div> */}
                    </Block>
                </>
            }
        </>
    );
}

export default PromptBuilder;