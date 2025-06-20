import React from 'react';
import { useState, useCallback } from 'react';
import { Module, Block, Lockup } from '@ux/layout';
import TextInput from '@ux/text-input';
import text from '@ux/text';
import Card from '@ux/card';
import Box from '@ux/box';
import Button from '@ux/button';
import AiModelSelect from './ai-model-select';
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
  const [promptModel, setPromptModel] = useState(null);
  const [evaluationModel, setEvaluationModel] = useState(null);
  const [promptErrorMessage, setPromptErrorMessage] = useState('');
  const [evalPromptErrorMessage, setEvalPromptErrorMessage] = useState('');
  function insertAction(e) {
    const text = prompt + ` [${e}]`;
    setPrompt(text);
  }

  function insertActionEval(e) {
    const text = evaluationPrompt + ` [${e}]`;
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
    try {
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
        if (!evaluationModel) {
          passed = false;
          setEvalPromptErrorMessage('Evaluation Prompt must have model selected');
        }
      }
      // Check if they try to increase the number of transactions to run by more the limit
      if (numOfTransactionsToRun > LIMIT_OF_TRANSACTIONS) {
        setNumOfErrorMessage(`Number of transactions to run cannot exceed ${LIMIT_OF_TRANSACTIONS}`);
        passed = false;
      }
    } catch (err) {
      console.error('Error in checkForInputs', err);
      passed = false;
    }



    return passed;

  }
  function handleModelChange(e) {
    try {
      setPromptModel({
        ...promptModel,
        model: e
      });
    } catch (err) {
      console.error('Error in handleModelChange', err);
    }
  }
  function handleEvalModelChange(e) {
    setEvaluationModel({ ...e });
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
    <Card className='lh-prompt-form-card' id='para-card' stretch space={{ inline: 'md', block: 'md' }}>
      <Box blockPadding='md' inlinePadding='md'>
        <Block>
          <Lockup>
            <Tag emphasis='neutral'>
              {`Number of Transactions ${numOfTransactions}`}
            </Tag>
          </Lockup>
        </Block>
        <Box blockPadding='sm' inlinePadding='md'>
          <AiModelSelect id='aiModel' name='aiModel' label='AI Model' onChange={handleModelChange} />
        </Box>
        <Box blockPadding='sm' inlinePadding='md'>
          <TextInput id='number-to-run' errorMessage={numOfErrorMessage}
            className='m-t-1' helpMessage={numberToRunHelpMessage} value={numOfTransactionsToRun}
            onChange={handleNumberOfTransactionChange} label='Number of Transcripts to Run' name='numOfTranscripts' />
        </Box>
        <Box blockPadding='sm' inlinePadding='md'>
          <Menu id='my-menu' size='small' className='m-t-1'>
            <MenuButton icon={<Add />} text='Insert' design='secondary' />
            <MenuList className='lh-menu' design='primary'>
              <MenuItem key='transcript' aria-label='transcripts' onSelect={insertAction}>transcript</MenuItem>
              <MenuItem key='llm_response' aria-label='llm_response' onSelect={insertAction}>llm_response</MenuItem>
            </MenuList>
          </Menu>
        </Box>
        <Box blockPadding='sm' inlinePadding='md'>
          <text.p as='paragraph' className='m-t-1' text='Do not insert MNPI (Material Non-Public Information) into Lighthouse' emphasis='critical' />
          <TextInput aria-required required={true} id='prompt-form' errorMessage={promptErrorMessage}
            label='Prompt' name='prompt' helpMessage='[transcript] is a required prompt insert'
            onChange={handlePrompt} value={prompt} multiline size={10} />
          <Card id='evaluation' className='m-t-1' stretch title='Eval'>
            <Box blockPadding='md' inlinePadding='md' stretch>
              <Lockup orientation='vertical'>
                <Checkbox id='include-eval-chk' label='Include Evaluation' onChange={handleIncludeEval} name='include' />
              </Lockup>
              {includeEval ?
                <div className="eval m-t-1">
                  <text.label as='label' text='Evaluation Parameters' />
                  <AiModelSelect id='model-select-eval' className='m-b-1' name='model-select-eval' label='Model' onChange={handleEvalModelChange} />
                  <Menu id='my-menu-for-eval' className='m-t-1'>
                    <MenuButton icon={<Add />} text='Insert' design='secondary' />
                    <MenuList className='lh-menu' design='primary'>
                      <MenuItem key='transcript' onSelect={insertActionEval}>transcript</MenuItem>
                      <MenuItem key='llm_response' aria-label='llm_response' onSelect={insertActionEval}>llm_response</MenuItem>
                    </MenuList>
                  </Menu>
                  <TextInput label='Prompt' name='evalPromp' onChange={handleEvalPrompt} errorMessage={evalPromptErrorMessage} helpMessage='[transcript] and [llm_response] are required prompt inserts' value={evaluationPrompt} multiline size={7} />
                </div> : null}
            </Box>
          </Card>
        </Box>
        <Box orientation='horizontal' blockAlignChildren='end' inlinePadding='lg'>
          <Button className='m-t-1' text="Run Prompt" onClick={handleJobSumbit} aria-label='submit-run' design='primary' />
        </Box>
      </Box>
    </Card>
  );
};

export default PromptForm;
