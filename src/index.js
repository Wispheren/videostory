import { getElm, getElms, newElm, getUniqueID } from './htmlutil';

const fetchAllData = paths => {
    return new Promise(allResolved => {
        let fetchedData = {};

        Promise.all(Object.keys(paths).map(key => new Promise(resolve => {
            fetch(paths[key]).then(response => response.json()).then(json => {
                if (key === 'properties') {
                    fetchedData.properties = {};
                    json.data.forEach(row => fetchedData.properties[row.name] = row.value);
                }
                else {
                    fetchedData[key] = json.data;
                }

                resolve();
            });
        })
        )).then(() => allResolved(fetchedData));
    });
};

const _insertVideoStory = config => {
    let id = 'videoStory' + getUniqueID(),
    mainDiv = newElm('div').withId(id),
    data = null,
    init = () => {
        console.log('data', data);
    };

    fetchAllData(config.spreadSheetPaths).then(fetchedData => {
        data = fetchedData;
        init();
    });

    config.elm.parentNode.insertBefore(mainDiv, config.elm);
    config.elm.parentNode.removeChild(config.elm);
};

let isAdmin = !!window.document.body.getAttribute('data-admin');

if (isAdmin) {    
    let html = document.body.innerHTML,
    currentPath = `${window.location.protocol}//${window.location.host}`;

    html = html.replace(/"\.?(\/static\/js\/)/g, '"' + currentPath + '$1');

    while (window.document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }

    console.log('html', html);
}
else {window.insertVideoStory = window.insertVideoStory || _insertVideoStory;
    if (window.pendingVideoStory && typeof window.pendingVideoStory.forEach === 'function') {
        window.pendingVideoStory.forEach(config => _insertVideoStory(config));
    }
}