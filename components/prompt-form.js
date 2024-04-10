import React from 'react';
import { useState, useCallback } from 'react';
import { Module, Block, Lockup } from '@ux/layout';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import Card from '@ux/card';
import Button from '@ux/button';
import SelectInput from '@ux/select-input';
import Checkbox from '@ux/checkbox';
import Tag from '@ux/tag';
import Add from '@ux/icon/add';
import { Menu, MenuButton, MenuList, MenuItem } from '@ux/menu';


const PromptForm = ({ onSubmit, numOfTransactions }) => {
    const LIMIT_OF_TRANSACTIONS = 400;
    const [numberToRunHelpMessage, setNumberToRunHelpMessage] = useState();
    const [numOfTransactionsToRun, setNumOfTransactionsToRun] = useState(numOfTransactions > LIMIT_OF_TRANSACTIONS ? LIMIT_OF_TRANSACTIONS : numOfTransactions);
    const [numOfErrorMessage, setNumOfErrorMessage] = useState();
    const [prompt, setPrompt] = useState('');
    const [evaluationPrompt, setEvaluationPrompt] = useState('');
    const [includeEval, setIncludeEval] = useState(false);
    const [promptModel, setPromptModel] = useState('claude-instant-v1');
    const [evaluationModel, setEvaluationModel] = useState('claude-instant-v1');
    const [promptErrorMessage, setPromptErrorMessage] = useState('');
    const [evalPromptErrorMessage, setEvalPromptErrorMessage] = useState('');

    function insertAction(e) {
        console.log(e, prompt);
        let text = prompt + ` [${e}]`;
        setPrompt(text);
    }
    function handleModelChange(e) {
        console.log(e);
    }
    function insertActionEval(e) {
        let text = evaluationPrompt + ` [${e}]`;
        setEvaluationPrompt(text);
    }
    const handlePrompt = useCallback((e) => { setPrompt(e); }, []);
    function handleEvalPrompt(e) {
        setEvaluationPrompt(e);
    }
    function handleJobSumbit(e) {
        e.preventDefault();
        if (!checkForInputs()) return;
        onSubmit({ prompt, promptModel, numOfTransactionsToRun, includeEval, evaluationPrompt, evaluationModel });
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
    function handleModelChange(e) {
        setPromptModel(e);
    }
    function handleEvalModelChange(e) {
        setEvaluationModel(e);
    }
    function handleNumberOfTransactionChange(e) {
        if (e > LIMIT_OF_TRANSACTIONS) {
            setNumOfTransactionsToRun(e > LIMIT_OF_TRANSACTIONS ? LIMIT_OF_TRANSACTIONS : e);
            setNumberToRunHelpMessage(`Max number of transactions is ${LIMIT_OF_TRANSACTIONS}`);
        } else {
            setNumOfTransactionsToRun(e);
            setNumberToRunHelpMessage('');
        }
    }
    function handleIncludeEval(e) {
        setIncludeEval(!includeEval);
    }
    return (
        <>
            <Module>
                <text.h4 as='title' text='Parameters' />
                <p>
                    <Tag emphasis='neutral'>
                        {`Number of Transactions ${numOfTransactions}`}
                    </Tag>
                </p>
                <SelectInput onChange={handleModelChange} id='model' name='model' label='Model'>
                    <option value='claude-instant-v1'>claude-instant-v1</option>
                    <option value='claude-v2'>claude-v2</option>
                </SelectInput>
                <TextInput id='number-to-run' errorMessage={numOfErrorMessage}
                    className='m-t-1' helpMessage={numberToRunHelpMessage} value={numOfTransactionsToRun}
                    onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
                <Menu id='my-menu' size='small' className='m-t-1'>
                    <MenuButton icon={<Add />} text='Insert' design='secondary' />
                    <MenuList className='lh-menu' design='primary'>
                        <MenuItem key='transcript' aria-label='transcripts' onSelect={insertAction}>transcript</MenuItem>
                    </MenuList>
                </Menu>
                <TextInput aria-required required={true} id='prompt-form' errorMessage={promptErrorMessage}
                    label='Prompt' className='m-t-1' name='prompt' helpMessage='[transcript] is a required prompt insert'
                    onChange={handlePrompt} value={prompt} multiline size={10} />
                <Card id='evaluation' className='m-t-1' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                    <Lockup orientation='vertical'>
                        <Checkbox id='include-eval-chk' label='Include Evaluation' onChange={handleIncludeEval} name='include' />
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
                <Button className='m-t-1' text="Run Prompt" onClick={handleJobSumbit} aria-label='submit-run' design='primary' />
            </Module>
        </>

    )
}

export default PromptForm;