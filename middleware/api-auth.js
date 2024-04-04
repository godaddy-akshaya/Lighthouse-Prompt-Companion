module.exports = async function doSomethingSecurely(req, res) {
    const { valid, reason, details } = await req.checkAuth({
        realm: 'jomax',
        risk: 'medium'
    });

    if (valid) {
        // Authenticated: continue
        console.log('Authenticated')
    } else {
        console.log('Unauthenticated')
        // Unauthenticated: exit
    }
}