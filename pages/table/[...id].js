
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Spinner from '@ux/spinner';
import { Block, Lockup, Module } from '@ux/layout';
import Head from '../../components/head';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import '@ux/icon/home/index.css';
import Add from '@ux/icon/add';
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
import { Menu, MenuButton, MenuList, MenuItem } from '@ux/menu';
import '@ux/menu/styles';
import SiblingSet from '@ux/sibling-set';
import { getTableRowCount, getTableFilters, getTables, submitPromptJob } from '../../lib/api';
import FilterCards from '../../components/filter-cards';
import DateInput from '@ux/date-input';
import Alert from '@ux/alert';
import Tag from '@ux/tag';
import session from '../../lib/session';
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
import '@ux/date-input/styles';
import { getGuid } from '../../lib/utils';
import MessageOverlay from '@ux/message-overlay';

const PromptBuilder = ({ authDetails }) => {
    const LIMIT_OF_TRANSACTIONS = 400;
    const [isLoading, setIsLoading] = useState(true);
    const [tables, setTables] = useState();
    const [prompt, setPrompt] = useState('');
    const [guid, setGuid] = useState('');
    const [numOfTransactions, setNumOfTransactions] = useState(0);
    const [numberToRunHelpMessage, setNumberToRunHelpMessage] = useState();
    const [numOfErrorMessage, setNumOfErrorMessage] = useState();
    const [showMessage, setShowMessage] = useState(false);
    const [numOfTransactionsToRun, setNumOfTransactionsToRun] = useState(0);
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [includeEval, setIncludeEval] = useState(false);
    const [promptModel, setPromptModel] = useState('claude-instant-v1');
    const [evaluationModel, setEvaluationModel] = useState('claude-instant-v1');
    const [evaluationPrompt, setEvaluationPrompt] = useState('');
    const [showTableSelect, setShowTableSelect] = useState(false);
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [isPromptFormVisible, setIsPromptFormVisible] = useState(false);
    const [columns, setColumns] = useState();
    const [errorMessage, setErrorMessage] = useState('Something went wrong');
    const [startDateValue, setStartDateValue] = useState(['2024-01-01']);
    const [selectedTable, setSelectedTable] = useState();
    const [endDateValue, setEndDateValue] = useState(['2024-01-30']);
    const [promptErrorMessage, setPromptErrorMessage] = useState('');
    const [evalPromptErrorMessage, setEvalPromptErrorMessage] = useState('');
    const [dateValue, setDateValue] = useState({
        column_name: 'rpt_mst_date',
        column_selected_values: [startDateValue[0], endDateValue[0]],
        column_data_type: 'date',
    });
    const router = useRouter();
    const [routeParams, setRouteParams] = useState({
        table: decodeURIComponent(router.query?.id?.[0] || '0'),
        display_name: decodeURI(router.query?.display_name) || decodeURIComponent(router.query?.id?.[0] || '0')
    });
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    function insertAction(e) {
        let text = prompt + ` [${e}]`;
        setPrompt(text);
    }

    function insertActionEval(e) {
        let text = evaluationPrompt + ` [${e}]`;
        setEvaluationPrompt(text);
    }
    function handlePrompt(e) {
        setPrompt(e);
    }
    function handleEvalPrompt(e) {
        setEvaluationPrompt(e);
    }
    function handleStartDateValue(e) {
        setStartDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [e[0], endDateValue[0]] });
    }
    function handleEndDateValue(e) {
        setEndDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [startDateValue[0], e[0]] });
    }
    function handleModelChange(e) {
        setPromptModel(e);
    }
    function handleEvalModelChange(e) {
        setEvaluationModel(e);
    }
    function handleNumberOfTransactionChange(e) {
        setNumOfTransactionsToRun(e);
    }
    function handleIncludeEval(e) {
        setIncludeEval(!includeEval);
    }
    function handleTableRouteChange(e) {
        router.push(`/table/${encodeURIComponent(selectedTable)}`);
        setRouteParams({ ...routeParams, table: selectedTable });
    }
    function handleSelectAll(e) {
        let _columns = columns.map(column => {
            if (column.column_name === e.column_name) {
                return {
                    ...column,
                    checkbox_columns: e.checkbox_columns.map(x => ({ ...x, value: true })),
                    column_selected_values: e.checkbox_columns.map(x => x.label)
                };
            }
            return column;
        });
        setColumns(_columns);
    }
    function handleDeselectAll(e) {
        let _columns = columns.map(column => {
            if (column.column_name === e.column_name) {
                return {
                    ...column,
                    checkbox_columns: e.checkbox_columns.map(x => ({ ...x, value: false })),
                    column_selected_values: []
                };
            }
            return column;
        });
        setColumns(_columns);

    }
    function handleTableSelect(event) {
        setSelectedTable(event);
    }
    function handleFilterChange(e) {
        let _columns = columns?.map(column => {
            if (column.column_name.toLowerCase() === e.column.toLowerCase()) {
                return {
                    ...column,
                    has_been_modified: true,
                    checkbox_columns: column.checkbox_columns.map(checkbox_column => {
                        if (checkbox_column.label === e.label) {
                            return { ...checkbox_column, value: e.value };
                        }
                        return checkbox_column;
                    })
                };
            }
            return column;
        });
        setColumns(_columns);
    }
    function handleJobSubmit(e) {
        e.preventDefault();
        if (!checkForInputs()) return;
        (async () => {
            const g = await getGuid();
            setGuid(g);
            let job = {
                count: numOfTransactionsToRun,
                run_id: g,
                prompt: prompt,
                evaluation: includeEval,
                model: promptModel,
                evaluation_model: evaluationModel || '',
                evaluation_prompt: evaluationPrompt || '',
            }
            setIsLoading(true);
            submitPromptJob(routeParams.table, job, columns, dateValue).then(data => {
                router.push(`/run-status?newJob=${g}`, undefined, { shallow: true });
            });
        })();
    }
    function handleModelChange(e) {
        console.log(e);
    }
    function handleCloseError(e) {
        setShowUserMessage(false);
        setErrorMessage('');
    }
    /*  after posting prompt form -> results page    */
    function handleTableRowSubmit(e) {
        e.preventDefault();
        setIsPromptVisible(true);
        setIsPromptFormVisible(false);
        setShowMessage(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        getTableRowCount(routeParams.table, columns, dateValue).then(data => {
            if (data?.errorMessage) {
                setNumOfTransactions(0);
                setNumOfTransactionsToRun(0);
                setErrorMessage(data.errorMessage);
                setShowUserMessage(true);
                setShowMessage(false);
            } else {
                setNumOfTransactions(data || 0);
                setNumOfTransactionsToRun(data > LIMIT_OF_TRANSACTIONS ? LIMIT_OF_TRANSACTIONS : data);
                setNumberToRunHelpMessage(`Max number of transactions is ${LIMIT_OF_TRANSACTIONS}`);
                setIsPromptFormVisible(true);
                setShowMessage(false);
            }
        }, error => {
            setErrorMessage(error);
            setIsLoading(false);
            setShowUserMessage(true);
        });

    }
    function checkForInputs() {
        let passed = true;
        // need to make sure [transcript] is in the prompt
        if (prompt.indexOf('[transcript]') === -1) {
            setPromptErrorMessage('Prompt must contain [transcript]');
            passed = false;
        }
        if (includeEval) {
            if (evaluationPrompt.indexOf('[transcript]') === -1 || evaluationPrompt.indexOf('[llm_response]') === -1) {
                setEvalPromptErrorMessage('Evaluation Prompt must contain [transcript] and [llm_response]');
                passed = false;
            }
        }
        // Check if they try to increase the number of transactions to run by more the limit
        if (numOfTransactionsToRun > LIMIT_OF_TRANSACTIONS) {
            setNumOfErrorMessage(`Number of transactions to run cannot exceed ${LIMIT_OF_TRANSACTIONS}`);
            passed = false;
        }
        return passed;
    }
    useEffect(() => {
        if (routeParams.table === '0') {
            getTables().then(data => {
                setTables(data);
                setShowTableSelect(true);
                setIsLoading(false);
            });
        } else {
            getTableFilters(routeParams.table).then(data => {
                setColumns(data);
                setShowTableSelect(false);
                setIsLoading(false);
            });
        }
    }, [routeParams]);
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
            {showTableSelect && <>

                <Block as='stack' orientation='vertical'>
                    <Card id='table-select-card' className='grey-card'>
                        <Block orientation='horizontal' >
                            <text.h4 as='title' text='Get Started' />
                            <text.p as='paragraph' text='To get this party started, select a table from the list and select go' />
                            <SiblingSet style={{ 'width': '650px' }} stretch={true} gap='sm'>
                                <SelectInput className='select-table' label='' stretch={true} onChange={handleTableSelect} id='tables' name='select'>
                                    <option value=''>Select...</option>
                                    {tables?.map(table => <option key={table.column_name} value={table.column_name}>{table.display_name}</option>) || null}
                                </SelectInput>
                                <Button text='Go' design='primary' as='cta' onClick={handleTableRouteChange} />
                            </SiblingSet>
                        </Block>
                    </Card>
                </Block>
            </>}
            {!isLoading && !showTableSelect && <>
                <Block as='stack' orientation='vertical'>
                    <Block orientation='horizontal'>
                        <Lockup >
                            <text.h3 text={routeParams.display_name || 'missing'} as='heading' />
                        </Lockup>
                    </Block>
                    <div className='lh-container lh-between'>
                        <Block>
                            <form onSubmit={handleTableRowSubmit}>
                                <Card id='table-params-card' stretch={true} title='Parameters'>
                                    <Module>
                                        {columns?.length > 0 ? <text.h4 as='title' text='Available Filters' /> : null}

                                        <div className='lh-filter-container'>
                                            <div className='lh-container lh-between'>
                                                <DateInput id='start' name='start-date' value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                                                <DateInput id='end' name='end-date' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                                            </div>
                                        </div>
                                        <div className='lh-filter-container'>
                                            {
                                                columns?.map((field, index) =>
                                                    <FilterCards key={field.column_name} open={false} id={field.column_name} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} onChange={handleFilterChange} label={field.label} options={field} />
                                                )
                                            }
                                        </div>
                                        <Button text="Fetch Results" aria-label='Submit Results' type='submit' design='primary' />
                                    </Module>
                                </Card>
                            </form>
                        </Block>
                        <Block>
                            {isPromptVisible && <Card className='lh-prompt-form-card' id='para-card' stretch={true} title='Parameters'>
                                {showMessage && <MessageOverlay onEventBehind={handleTableRowSubmit} >
                                    <Block as='stack' className='text-center' orientation='vertical'>
                                        <text.label as='label' text='Getting number of transcripts based on your selections' />
                                        <br />
                                        <Spinner />
                                    </Block>
                                </MessageOverlay>}
                                <>
                                    <form onSubmit={handleJobSubmit}>
                                        <Module>
                                            <text.h4 as='title' text='Parameters' />
                                            {isPromptFormVisible && <>
                                                <p>
                                                    <Tag emphasis='neutral'>
                                                        {`Number of Transactions ${numOfTransactions}`}
                                                    </Tag>
                                                </p>
                                                <SelectInput onChange={handleModelChange} id='model' name='model' label='Model'>
                                                    <option value='claude-instant-v1'>claude-instant-v1</option>
                                                    <option value='claude-v2'>claude-v2</option>
                                                </SelectInput>
                                                <TextInput id='number-to-run' errorMessage={numOfErrorMessage} className='m-t-1' helpMessage={numberToRunHelpMessage} value={numOfTransactionsToRun} onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
                                                <Menu id='my-menu' size='small' className='m-t-1'>
                                                    <MenuButton icon={<Add />} text='Insert' design='secondary' />

                                                    <MenuList className='lh-menu' design='primary'>
                                                        <MenuItem key='transcript' aria-label='transcripts' onSelect={insertAction}>transcript</MenuItem>
                                                    </MenuList>
                                                </Menu>
                                                <TextInput aria-required required={true} id='prompt-test' errorMessage={promptErrorMessage} label='Prompt' className='m-t-1' name='prompt' helpMessage='[transcript] is a required prompt insert' onChange={handlePrompt} value={prompt} multiline size={10} />
                                                <Card id='evaluation' className='m-t-1' stretch='true' title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                                                    <Lockup orientation='vertical'>
                                                        <Checkbox label='Include Evaluation' onChange={handleIncludeEval} name='include' />
                                                    </Lockup>
                                                    {includeEval ?
                                                        <div className="eval m-t-1">
                                                            <text.label as='label' text='Evaluation Parameters' />
                                                            <SelectInput id='model-select' className='m-t-1' name='model-select' onChange={handleEvalModelChange} label='Model'>
                                                                <option value='claude-instant-v1'>claude-instant-v1</option>
                                                                <option value='claude-v2'>claude-v2</option>
                                                            </SelectInput>
                                                            <Menu id='my-menu-for-eval' className='m-t-1'>
                                                                <MenuButton icon={<Add />} text='Insert' design='secondary' />
                                                                <MenuList className='lh-menu' design='primary'>
                                                                    <MenuItem key='transcript' onSelect={insertActionEval}>transcript</MenuItem>
                                                                    <MenuItem key='llm_response' aria-label='llm_response' onSelect={insertActionEval}>llm_response</MenuItem>
                                                                </MenuList>
                                                            </Menu>

                                                            <TextInput label='Prompt' name='evalPromp' onChange={handleEvalPrompt} errorMessage={evalPromptErrorMessage} helpMessage='[transcript] and [llm_response] are required prompt inserts' value={evaluationPrompt} multiline size={7} />
                                                        </div> : null}
                                                </Card>
                                                <Button className='m-t-1' text="Run Prompt" type='submit' aria-label='submit-run' design='primary' />
                                            </>}

                                        </Module>

                                    </form>
                                </>
                            </Card>}
                        </Block>
                    </div>
                </Block>
            </>
            }
        </>
    );
}

export default PromptBuilder;