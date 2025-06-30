import BaseMenu from './base-menu';
const InteractionIds = ({ onChange }) => {
  return (
    <BaseMenu
      onChange={onChange}
      menuText='Interaction Ids'
      enableSave
      columnName='interaction_id'
    />
  );
};
export default InteractionIds;
