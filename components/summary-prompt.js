import React, { useState } from 'react';
import Button from '@ux/button';
import CreateForm from '@ux/icon/create-form';
import Modal from '@ux/modal';
import { Block, Lockup } from '@ux/layout';
import { getGuid } from '../lib/utils';
import TextInput from '@ux/text-input';
import SelectInput from '@ux/select-input';
import '@ux/menu/styles';
import { Menu, MenuButton, MenuList, MenuItem } from '@ux/menu';
import Add from '@ux/icon/add';

export default function SummaryPrompt({ runId, count, isModalOpen, eventSave, eventOpen, eventCancel }) {
    const [prompt, setPrompt] = useState('');
    const [numOfErrorMessage, setNumOfErrorMessage] = useState();
    const [promptErrorMessage, setPromptErrorMessage] = useState();
    const [model, setModel] = useState('claude-instant-v1');
    const [numToRun, setNumToRun] = useState(count);

    function handlePrompt(e) {
        setPrompt(e);
    }
    function checkForm() {
        // check prompt and count
        if (prompt == '') setPromptErrorMessage('Prompt is required');
        if (prompt.indexOf('[concatenation_of_responses]') === -1) {
            setPromptErrorMessage('Prompt must contain [concatenation_of_responses]');
            passed = false;
        }
        if (numToRun < 0) setNumOfErrorMessage('Number of transactions must be a positive number');
        if (numToRun > count) setNumOfErrorMessage('Number of transactions must be less than or equal to the total number of transactions');
        if (prompt === '' || numToRun < 0 || numToRun > count) {
            return false;
        }
        return true;
    }

    function insertAction(e) {
        let text = prompt + ` [${e.target.value}]`;
        setPrompt(text);
    }
    async function handleSaveEvent() {
        if (!checkForm()) {
            return;
        }
        let formData = {
            parent_run_id: runId,
            new_run_id: await getGuid(),
            model: model,
            prompt: prompt,
            count: numToRun.toString(),
        }
        eventSave(formData);
    }
    const handleNumberOfTransactionChange = (e) => {
        if (e < 0) {
            setNumOfErrorMessage('Number of transactions must be a positive number');
        } else {
            setNumOfErrorMessage('');
        }
        if (e > count) {
            setNumOfErrorMessage('Number of transactions must be less than or equal to the total number of transactions');
        }
        setNumToRun(e);
    }
    const handleCancel = () => {
        eventCancel();
    }
    const title = 'Create Summary Prompt';
    const actions = (
        <>
            <Button design='primary' onClick={() => handleSaveEvent(false)} text='Continue' />
            <Button design='secondary' onClick={() => handleCancel(false)} text='Cancel' />
        </>
    );
    const modal = (
        <Modal className='summary-prompt-modal' id='modal-summary' title={title} onClose={() => handleCancel(false)} actions={actions}>
            <Block>

                <SelectInput defaultValue={model} onChange={(e) => { setModel(e) }} id='model' name='model' label='Model'>
                    <option value='claude-instant-v1'>claude-instant-v1</option>
                    <option value='claude-v2'>claude-v2</option>
                </SelectInput>
                <TextInput id='number-to-run' errorMessage={numOfErrorMessage} className='m-t-1' value={numToRun.toString()} defaultValue={count?.toString()} onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />

                <Button text='Insert' icon={<Add />} design='secondary' value='concatenation_of_responses' onClick={insertAction} />

                <Menu id='my-menu-for-summary' className='m-t-1' >
                    <MenuButton icon={<Add />} text='Insert' design='secondary' />
                    <MenuList>
                        <MenuItem onSelect={insertAction}>concatenation_of_responses</MenuItem>
                    </MenuList>
                </Menu>



                <TextInput aria-required required={true} id='summary-prompt-input' errorMessage={promptErrorMessage} label='Prompt' className='m-t-1' name='prompt' onChange={handlePrompt} value={prompt} multiline size={10} />
            </Block>
        </Modal>
    );
    return (
        <>
            <Button onClick={() => { eventOpen(true) }} text='Create Summary Prompt' icon={<CreateForm />} />
            {isModalOpen && modal}
        </>

    )
};