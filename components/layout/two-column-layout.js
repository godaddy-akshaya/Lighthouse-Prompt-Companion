const TwoColumnLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', paddingRight: '1rem' }}>
      <div style={{ width: '50%' }}>
        {children[0]}
      </div>
      <div style={{ width: '50%', paddingLeft: '1rem' }}>
        {children[1] || null}
      </div>
    </div>
  );
};

export default TwoColumnLayout;
