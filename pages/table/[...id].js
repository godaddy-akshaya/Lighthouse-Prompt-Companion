
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
import FieldFrame from '@ux/field-frame';
import '@ux/field-frame/styles';
import '@ux/date-input/styles';
import Card, { spaceOptions } from '@ux/card';
import '@ux/filter/styles';
import { Menu, MenuButton, MenuList, MenuItem } from '@ux/menu';
import '@ux/menu/styles';
import SiblingSet from '@ux/sibling-set';
import { getNumRows, getTableMetaData, getTables } from '../../lib/api';
import FilterCards from '../../components/filter-cards';
import DateInput from '@ux/date-input';
import Alert from '@ux/alert';
import Tag from '@ux/tag';
import '@ux/date-input/styles';
import { getGuid } from '../../lib/utils';

const PromptBuilder = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [tables, setTables] = useState();
    const [prompt, setPrompt] = useState('');
    const [numOfTransactions, setNumOfTransactions] = useState(0);
    const [numOfTransactionsToRun, setNumOfTransactionsToRun] = useState(0);
    const [showUserMessage, setShowUserMessage] = useState(false);
    const [includeEval, setIncludeEval] = useState(false);
    const [showTableSelect, setShowTableSelect] = useState(false);
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [columns, setColumns] = useState();
    const [errorMessage, setErrorMessage] = useState('Something went wrong');
    const [startDateValue, setStartDateValue] = useState(['2024-01-01']);
    const [selectedTable, setSelectedTable] = useState();
    const [endDateValue, setEndDateValue] = useState(['2024-01-30']);
    const [dateValue, setDateValue] = useState({
        column_name: 'rpt_mst_date',
        column_selected_values: [startDateValue, endDateValue],
        column_data_type: 'date',
    });
    const router = useRouter();
    const [routeParams, setRouteParams] = useState({
        table: decodeURIComponent(router.query?.id?.[0] || 'default')
    });
    function insertAction(e) {
        let text = prompt + ` {${e}}`;
        setPrompt(text);
    }
    function handlePrompt(e) {
        setPrompt(e);
    }
    function handleStartDateValue(e) {
        setStartDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [e, endDateValue] });
    }
    function handleEndDateValue(e) {
        setEndDateValue(e);
        setDateValue({ ...dateValue, column_selected_values: [startDateValue, e] });
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
        let _columns = columns.map(column => {
            if (column.column_name.toLowerCase() === e.column.toLowerCase()) {
                return {
                    ...column,
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
    function handleRunClick(e) {
        e.preventDefault();
        (async () => {
            const g = await getGuid();
            setGuid(g);
        })();
    }
    function handleTableRowSubmit(e) {
        e.preventDefault();
        setIsLoading(true);
        // Appned data to the columns
        let _columns = [...columns];
        _columns.push(dateValue);
        getNumRows(routeParams.table, columns).then(data => {
            setNumOfTransactions(data || 0);
            setNumOfTransactionsToRun(data || 0);
            setIsPromptVisible(true);
            setIsLoading(false);
        }, error => {
            setErrorMessage(error);
            setIsLoading(false);
            setShowUserMessage(true);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    useEffect(() => {
        if (routeParams.table == 0) {
            getTables().then(data => {
                setTables(data.tables);
                setShowTableSelect(true);
                setIsLoading(false);
            });
        } else {
            getTableMetaData(routeParams.table).then(data => {
                setColumns(data);
                setShowTableSelect(false);
                setIsLoading(false);
            });
        }
    }, [routeParams]);
    return (
        <>  <Head title='Prompt Parameters' route='table' />
            {showUserMessage && <>
                <Alert
                    title={errorMessage}
                    id='critical-message'
                    emphasis="critical"
                    actions={<Button design="inline" text="Close" />} />
            </>}
            {isLoading && <Spinner />}
            {showTableSelect && <>
                <Block as='stack' orientation='vertical'>
                    <Card id='table-select-card' className='grey-card'>
                        <Block orientation='horizontal' >
                            <text.h4 as='title' text='Get Started' />
                            <text.p as='paragraph' text='To get this party started, select a table from the list and select go' />
                            <SiblingSet style={{ 'width': '650px' }} stretch={true} gap='sm'>
                                <SelectInput className='select-table' label='' stretch={true} onChange={handleTableSelect} id='tables' name='select'>
                                    <option value=''>Select...</option>
                                    {tables?.map(table => <option key={table} value={table}>{table}</option>) || null}
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
                            <text.h3 text={routeParams.table || 'missing'} as='heading' />
                        </Lockup>
                    </Block>
                    <div className='lh-container lh-between'>
                        <Block>
                            <form onSubmit={handleTableRowSubmit}>
                                <Card id='table-params-card' stretch={true} title='Parameters'>
                                    <Module>
                                        {columns?.length > 0 ? <text.h4 as='title' text='Available Filters' /> : null}
                                        <div className='lh-filter-container'>
                                            <DateInput id='start' value={startDateValue} onChange={handleStartDateValue} label='Start Date' />
                                            <DateInput id='end' value={endDateValue} onChange={handleEndDateValue} label='End Date' />
                                        </div>
                                        <text.h4 as='title' text='Table Columns' />
                                        <div className='lh-filter-container'>
                                            {
                                                columns?.map(field =>
                                                    <FilterCards key={field.column_name} id={field.column_name} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} onChange={handleFilterChange} label={field.label} options={field} />
                                                )
                                            }
                                        </div>
                                        <Button text="Fetch Results" type='submit' design='primary' />
                                    </Module>
                                </Card>
                            </form>
                        </Block>
                        <Block>
                            {isPromptVisible &&
                                <>  <form onSubmit={handleRunClick}>
                                    <Card id='para-card' stretch="true" title='Parameters'>
                                        <Module>
                                            <text.h4 as='title' text='Parameters' />
                                            <p>
                                                <Tag emphasis='neutral'>
                                                    {`Number of Transactions ${numOfTransactions}`}
                                                </Tag>
                                            </p>
                                            <SelectInput id='model' name='model' label='Model'>
                                                <option value='Claude-instant-v1'>Claude-instant-v1</option>
                                                <option value='Claude-V2'>Claude-V2</option>
                                            </SelectInput>
                                            <TextInput id='number-to-run' className='m-t-1' value={numOfTransactionsToRun} onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
                                            <Menu id='my-menu' className='m-t-1'>
                                                <MenuButton icon={<Add />} text='Insert' design='secondary' />
                                                <MenuList design='primary'>
                                                    {columns?.map(field => <MenuItem key={field.column_name} onSelect={insertAction}>{field.column_name}</MenuItem>) || null}
                                                </MenuList>
                                            </Menu>
                                            <TextInput id='prompt-test' label='Prompt' className='m-t-1' name='prompt' onChange={handlePrompt} value={prompt} multiline size={5} />
                                            <Card id='evaluation' className='m-t-1' stretch='true' title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                                                <Lockup orientation='vertical'>
                                                    <Checkbox label='Include Evaluation' onChange={handleIncludeEval} name='include' />
                                                </Lockup>
                                                {includeEval ?
                                                    <div className="eval">
                                                        <text.label as='label' text='Evaluation Parameters' />
                                                        <SelectInput id='model-select' className='m-t-1' name='model-select' label='Model-select'>
                                                            <option value='Claude-instant-v1'>Claude-instant-v1</option>
                                                            <option value='Claude-V2'>Claude-V2</option>
                                                        </SelectInput>
                                                        <TextInput label='Prompt' name='evalPromp' multiline size={5} />
                                                    </div> : null}
                                            </Card>
                                            <Button className='m-t-1' text="Run Prompt" type='submit' design='primary' />
                                        </Module>
                                    </Card>
                                </form>
                                </>
                            }
                        </Block>
                    </div>
                </Block>
            </>
            }
        </>
    );
}

export default PromptBuilder;