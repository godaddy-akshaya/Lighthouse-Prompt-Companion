import React from 'react';
import SelectInput from '@ux/select-input';
import useAiModels from '../hooks/use-ai-models';

const AiModelSelect = ({ onChange, defaultValue }) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);
  const { aiModels, loading, error } = useAiModels();
  /*
    ai_model_item: {
      model: ''
      model_name: '',
      provider: '',
      input_token_rate: '',
      output_token_rate: '',
      max_tokens: '',
    }

  */

  const handleModelChange = (e) => {
    const obj = aiModels.find(item => item.model === e);
    setSelectedValue(obj);
    onChange(obj);
  };

  return (
    <>
      {aiModels.length > 1 &&
        <SelectInput onChange={handleModelChange} required helpMessage={selectedValue ?
          `input rate: ${selectedValue.input_token_rate} / output rate: ${selectedValue.output_token_rate} /
              max tokens ${selectedValue?.max_tokens}` : ''}
          defaultValue={defaultValue?.model || null} id='model' name='model' label='Model'>
          {aiModels.map((item, index) => {
            return <option key={`fn${index}`} value={item.model}>
              {item.model_name}
            </option>;
          })}
        </SelectInput>
      }
      { }
      {(!aiModels || aiModels?.length === 0) && <div>{text('No models available')}</div>}
    </>


  );
};
export default AiModelSelect;
