const { Octokit }= require('@octokit/core');

const client = new Octokit();

const getContent = (ref, path) => client.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: 'audioxide',
    repo: 'data',
    ref,
    path,
});

const parseData = (encodedContent) => {
    const buff = Buffer.from(encodedContent, 'base64');
    const decodedData = buff.toString('utf-8');
};

exports.handler = async function(event, context) {
    const ref = 'review-black-country-new-road-for-the-first-time';
    const fileList = await getContent(ref, 'data/posts');
    if (fileList.status > 299 || fileList.status < 200) return { statusCode: fileList.status };
    const file = fileList.data.find(file => file.name.indexOf(ref) > -1);
    if (!file) return { statusCode: 404 };
    const fileContents = await getContent(ref, file.path);
    if (fileContents.status > 299 || fileContents.status < 200) return { statusCode: fileContents.status };

    return {
        statusCode: 200,
        body: JSON.stringify(listing)
    };
};