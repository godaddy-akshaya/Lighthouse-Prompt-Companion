import Button from "@ux/button";
import Box from "@ux/box";
import X from "@ux/icon/x";

const LoadedFilter = ({ rowCount, columnName, onClear }) => {
  const handleCancel = (e) => {
    e.preventDefault();
    onClear(columnName);
  };
  return (
    <Box>
      <Button
        icon={<X />}
        design='secondary'
        text={`${rowCount} ${columnName}`}
        onClick={handleCancel}
      />
    </Box>
  );
};

export default LoadedFilter;
