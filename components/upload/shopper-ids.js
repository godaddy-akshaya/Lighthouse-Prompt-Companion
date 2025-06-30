import BaseMenu from './base-menu';

const ShopperIds = ({ onChange }) => {
  return (
    <BaseMenu
      onChange={onChange}
      menuText='Shopper Ids'
      columnName='shopper_id'
    />
  );
};
export default ShopperIds;
