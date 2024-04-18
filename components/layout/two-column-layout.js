const TwoColumnLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'stretch', padding: '1rem' }}>
            <div style={{ width: '50%' }}>
                {children[0]}
            </div>
            <div style={{ width: '50%', padding: '1rem' }}>
                {children[1] || null}
            </div>
        </div>
    );
};

export default TwoColumnLayout;