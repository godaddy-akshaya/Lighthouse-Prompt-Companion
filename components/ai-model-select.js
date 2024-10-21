import React from 'react';
import SelectInput from '@ux/select-input';
import { Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuSeperator } from '@ux/menu';
import text from '@ux/text';
import '@ux/menu/styles';

const AiModelMenuItem = ({ item, index }) => {
  return (
    <>
      <text.label as='label' text={item.model_name} /><br />

    </>
  )
}

const AiModelSelect = ({ modelList, onChange, defaultValue = '' }) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

  const handleModelChange = (e) => {
    const _model = JSON.parse(e);
    setSelectedValue(JSON.parse(e));
    onChange(_model.model);
  }

  return (
    <>
      <SelectInput onChange={handleModelChange} helpMessage={`input rate: ${selectedValue.input_token_rate} /
      output rate: ${selectedValue.output_token_rate} /
      max tokens ${selectedValue?.max_tokens}`}
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