import React from 'react';
import SelectInput from '@ux/select-input';
import text from '@ux/text';
import '@ux/menu/styles';

const AiModelSelect = ({ modelList, onChange, defaultValue = '' }) => {
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
    const _model = JSON.parse(e);
    setSelectedValue(JSON.parse(e));
    console.log(_model);
    onChange(_model);
  }

  return (
    <>
      <SelectInput onChange={handleModelChange} helpMessage={selectedValue ?
        `input rate: ${selectedValue.input_token_rate} / output rate: ${selectedValue.output_token_rate} /
      max tokens ${selectedValue?.max_tokens}` : ''}
        defaultValue={defaultValue} id='model' name='model' label='Model'>
        <option value=''>Select Model</option>
        {modelList.map((item, index) => {
          return <option key={`fn${index}`} value={JSON.stringify(item)}>
            {item.model_name}
          </option>
        })}
      </SelectInput>
    </>

  );
}
export default AiModelSelect;
