import React, { useState } from 'react';
import Button from '@ux/button';
import CreateForm from '@ux/icon/create-form';
import Modal from '@ux/modal';
import { Block } from '@ux/layout';
import { getGuid } from '../lib/utils';
import TextInput from '@ux/text-input';
import Add from '@ux/icon/add';
import AiModelSelect from './ai-model-select';

export default function SummaryPrompt({ runId, count, isModalOpen, eventSave, eventOpen, eventCancel }) {
  const [prompt, setPrompt] = useState('');
  const [numOfErrorMessage, setNumOfErrorMessage] = useState();
  const [promptErrorMessage, setPromptErrorMessage] = useState();
  const [aiModel, setAiModel] = useState(null);
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
    const text = prompt + ` [${e.target.value}]`;
    setPrompt(text);
  }
  async function handleSaveEvent() {
    if (!checkForm()) {
      return;
    }
    const formData = {
      ...aiModel,
      parent_run_id: runId,
      new_run_id: await getGuid(),
      provider: aiModel.provider,
      model: aiModel.model,
      prompt: prompt,
      count: numToRun.toString()
    };
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
  };
  const handleCancel = () => {
    eventCancel();
  };
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
        {modelList.length > 0 &&
          <AiModelSelect onChange={setAiModel} id='ai-model' name='ai-model' />
        }
        <TextInput id='number-to-run' errorMessage={numOfErrorMessage} className='m-t-1' value={numToRun.toString()} defaultValue={count?.toString()} onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
        <Button text='Insert' icon={<Add />} className='m-t-1' design='secondary' value='concatenation_of_responses' onClick={insertAction} />
        <TextInput aria-required required={true} id='summary-prompt-input' errorMessage={promptErrorMessage} label='Prompt' className='m-t-1' name='prompt' onChange={handlePrompt} value={prompt} multiline size={10} />
      </Block>
    </Modal>
  );
  return (
    <>
      <Button onClick={() => { eventOpen(true); }} text='Create Summary Prompt' icon={<CreateForm />} />
      {isModalOpen && modal}
    </>
  );
}
