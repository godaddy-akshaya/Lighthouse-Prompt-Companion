import React from 'react';
import SelectInput from '@ux/select-input';

const AiModelSelect = ({ modelList, onChange, defaultValue }) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

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
    console.log(e);
    const obj = modelList.find(item => item.model === e);
    setSelectedValue(obj);
  };

  return (
    <>
      {modelList.length > 1 &&
        <SelectInput onChange={handleModelChange} required helpMessage={selectedValue ?
          `input rate: ${selectedValue.input_token_rate} / output rate: ${selectedValue.output_token_rate} /
              max tokens ${selectedValue?.max_tokens}` : ''}
          defaultValue={defaultValue?.model || null} id='model' name='model' label='Model'>
          {modelList.map((item, index) => {
            return <option key={`fn${index}`} value={item.model}>
              {item.model_name}
            </option>;
          })}
        </SelectInput>
      }
      {(!modelList || modelList?.length === 0) && <div>{text('No models available')}</div>}
    </>


  );
};
export default AiModelSelect;
