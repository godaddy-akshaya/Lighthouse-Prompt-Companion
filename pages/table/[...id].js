
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Spinner from '@ux/spinner';
import { Block, Lockup } from '@ux/layout';
import Head from '../../components/head';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import '@ux/icon/home/index.css';
import Add from '@ux/icon/add';
import '@ux/text-input/styles';
import '@ux/card/styles';
import Button from '@ux/button';
import '@ux/button/styles';
import SelectInput from '@ux/select-input';
import '@ux/select-input/styles';
import '@ux/icon/settings/index.css';
import '@ux/icon/wand/index.css';
import '@ux/icon/play/index.css';
import '@ux/icon/help/index.css';
import Checkbox from '@ux/checkbox';
import Select from '@ux/select';
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

import { getTables } from '../../lib/api';

const PromptBuilder = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [tableProps, setTableProps] = useState();
    const [includeEval, setIncludeEval] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [columns, setColumns] = useState();
    const router = useRouter();
    const [routeParams, setRouteParams] = useState({
        table: decodeURIComponent(router.query.id[0])
    });
    function insertAction(e) {
        let text = prompt + ` {${e}}`;
        setPrompt(text);
    }
    function handlePrompt(e) {
        setPrompt(e);
    }
    function handleNumberOfTransactionChange(e) {
        setNumOfTransactions(e);
    }
    function handleClick(e) {
        e.preventDefault();
        setShowPrompt(true);
    }
    function handleIncludeEval(e) {
        setIncludeEval(!includeEval);
    }
    function toProperJson(str) {
        let newArray = str.replace('{', '').replace('}', '').replaceAll("'", '');
        return newArray.split(',');
    }
    function toTitleCase(str) {
        return str.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    function handleRunClick(e) {
        e.preventDefault();
        (async () => {
            const g = await getGuid();
            setGuid(g);
        })();
    }
    function handleParameterChange(e) {
        console.log(e);
    }
    useEffect(() => {
        getTables().then((data) => {
            let columns = [...data].map((column) => {
                return {
                    ...column,
                    column_values: toProperJson(column.column_distinct_value_list),
                    is_multi_select: toProperJson(column.column_distinct_value_list).length > 2 ? true : false,
                    label: toTitleCase(column.column_name),
                }
            })
            setColumns(columns);
            setIsLoading(false);
        })
    }, []);
    return (
        <>  <Head title='Builder' />
            {isLoading && <Spinner />}
            {!isLoading && <>
                <Block as='stack' orientation='vertical'>
                    <Block orientation='horizontal'>
                        <Lockup >
                            <text.h3 text={'Top Level Insights' || 'missing'} as='heading' />
                        </Lockup>
                    </Block>

                    <div className='lh-container lh-between'>
                        <Block>
                            <Card id='table-params-card' stretch="true" space={{ inline: true, block: true, as: 'blocks' }} title='Parameters'>
                                {columns?.length > 0 ? <text.h4 as='title' text='Available Filters' /> : null}
                                {columns.map(field =>
                                    <FieldFrame className='field-container'>
                                        <Select className='select-field' id={field.column_name} multiple={field.is_multi_select} onChange={handleParameterChange} label={field.label}>
                                            {field.column_values.map(value => <option value={value}>{value}</option>)}
                                        </Select>
                                    </FieldFrame>


                                ) || null}
                                {/* {columns.map(field =>

                                    <SelectInput key={field.column_name} id={field.column_name} onChange={handleParameterChange} name="select" multiple="true" label={field.label}>
                                        {field.column_values.map(value => <option value={value}>{value}</option>)}
                                    </SelectInput>
                                ) || null} */}
                                <br />
                                <Button text="Fetch Results" onClick={handleClick} design='primary' />
                            </Card>
                        </Block>
                        <Block>
                            {showPrompt &&
                                <Card id='para-card' stretch="true" space={{ inline: true, block: true, as: 'blocks' }} title='Parameters'>
                                    <text.h4 as='title' text='Parameters' />
                                    <SelectInput className='m-t-1' label='Model'>
                                        <option value='Claude-instant-v1'>Claude-instant-v1</option>
                                        <option value='Claude-V2'>Claude-V2</option>
                                    </SelectInput>
                                    <TextInput className='m-t-1' onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
                                    <Menu id='my-menu' className='m-t-1'>
                                        <MenuButton icon={<Add />} text='Insert' design='secondary' />
                                        <MenuList design='primary'>
                                            {columns.map(field => <MenuItem onSelect={insertAction}>{field.column_name}</MenuItem>) || null}
                                        </MenuList>
                                    </Menu>
                                    <TextInput label='Prompt' className='m-t-1' name='prompt' onChange={handlePrompt} value={prompt} multiline size={3} />
                                    <Card id='evaluation' className='m-t-1' stretch='true' title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                                        <Lockup orientation='vertical'>
                                            <Checkbox label='Include Evaluation' onChange={handleIncludeEval} name='include' />
                                        </Lockup>
                                        {includeEval ?
                                            <div className="eval" >
                                                Evalution Parameters <br />
                                                <SelectInput className='m-t-1' label='Model'>
                                                    <option value='Claude-instant-v1'>Claude-instant-v1</option>
                                                    <option value='Claude-V2'>Claude-V2</option>
                                                </SelectInput>
                                                <TextInput label='Prompt' name='evalPromp' multiline size={3} />
                                            </div>
                                            : null}
                                    </Card> <br />
                                    <Button text="Run" onClick={handleRunClick} design='primary' />
                                </Card>
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