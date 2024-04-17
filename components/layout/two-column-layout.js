const TwoColumnLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: '50%' }}>
                {children[0]}
            </div>
            <div style={{ width: '50%' }}>
                {children[1] || null}
            </div>
        </div>
    );
};

export default TwoColumnLayout;