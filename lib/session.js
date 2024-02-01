const web_session = (function () {
    let _session = {
        weblogin: '',
        adGroups: [],
        selectedReportGroup: 0,
        selectedMetricDate: 0
    }

    const setSessionItem = function (prop, value) {
        _session[prop] = value;
    }
    const getSessionItem = function (prop) {
        return _session[prop];
    }
    const getWebLogin = function () {
        return _session.weblogin;
    }
    const getAdGroups = function () {
        return _session.adGroups;
    }
    const setAdGroups = function (groups) {
        const g = groups?.filter(group => group.startsWith('SCUI'));
        _session.adGroups = g;
    };
    const checkSession = function () {
        if (_session.weblogin == '') {
            console.log('Session is not set');
            return false;
        } else {
            console.log('Session is set');
            return true;
        }
    };
    return {
        setSessionItem,
        getSessionItem,
        setAdGroups,
        getAdGroups,
        getWebLogin,
        checkSession
    }
})();

export default web_session;