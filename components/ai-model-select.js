import React from 'react';
import SelectInput from '@ux/select-input';
import { Menu, MenuButton, MenuList, MenuItem, MenuGroup, MenuSeperator } from '@ux/menu';
import text from '@ux/text';
import '@ux/menu/styles';

const AiModelMenuItem = ({ item, index }) => {
  return (
    <>
      <text.label as='label' text={item.model_name} /><br />
      <text.span as='caption' text={`Input Token Rate ${item.input_token_rate != null ? (item.input_token_rate * 1).toFixed(4) : '-'}`} /> <br />
      <text.span as='caption' text={`Output Token Rate ${item.output_token_rate != null ? (item.output_token_rate * 1).toFixed(4) : '-'}`} /> <br />
      <text.span as='caption' text={`Max Tokens ${item.max_tokens}`} />
    </>
  )
}

const AiModelSelect = ({ modelList, onChange, defaultValue = 'Model' }) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

  const handleModelChange = (e) => {
    setSelectedValue(e);
    onChange(e.model);
  }

  return (
    <>
      <Menu id='my-menu' label='hi' onSelect={handleModelChange}>
        <MenuButton buttonAs='select' design='secondary' text={selectedValue && <AiModelMenuItem item={selectedValue} index={0} /> || 'Model'} />
        <MenuList>
          {modelList.map((item, index) =>
            <MenuItem key={`fnm${index}`} valueText={item} onSelect={handleModelChange}><AiModelMenuItem key={`fn${index}`} item={item} index={index} /></MenuItem>
          )}
        </MenuList>
      </Menu>
      {/* <SelectInput onChange={handleModelChange} defaultValue={defaultValue} id='model' name='model' label='Model'>
        {modelList.map((item, index) => {
          return <option key={`fn${index}`} value={item.model}>
            {item.model_name} - ${item.output_token_rate != null ? (item.output_token_rate * 1).toFixed(4) : '-'}
          </option>
        })}
      </SelectInput> */}
    </>

  );
}

export default AiModelSelect;