/* const { Octokit }= require('@octokit/core');

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
}; */
const { Octokit }= require('@octokit/core');
const fetch = require('node-fetch');
const YAML = require('yaml');
const markdownIt = require("markdown-it");

const authors = fetch('https://api.audioxide.com/authors.json').then(r => r.json());

const repoParams = {
    owner: 'audioxide',
    repo: 'data',
};

const atob = (encodedData) => {
    const buff = Buffer.from(encodedData, 'base64');
    return buff.toString('utf-8');
};

const btoa = (unencodedData) => {
    const buff = Buffer.from(unencodedData, 'utf-8');
    return buff.toString('base64');
}

const getAuthor = async (client) => {
    const { data: { login } } = await client.request('GET /user');
    if (!login) throw Error('Unable to retrieve username');
    const [id, matchedAuthor] = Object.entries(await authors)
        .find(([_, author]) => author?.links?.github === login);
    return {
        id,
        ...matchedAuthor,
    };
}

const getContent = (client, ref, path) => client.request('GET /repos/{owner}/{repo}/contents/{path}', {
    ...repoParams,
    ref,
    path,
});

const segmentDetector = /(^|\r?\n?)---\r?\n/;
const segmentDivisor = /\r?\n---\r?\n/;
const parseContent = (encodedContent) => {
    const decodedData = atob(encodedContent);
    // The file has to have content, and it has to have separators
    if (decodedData.length === 0 || !decodedData.match(segmentDetector)) throw Error('Malformed file');
    // Split the segments to get legal YAML
    const segments = decodedData.split(segmentDivisor);
    return segments.map(segment => YAML.parse(segment));
};

const getReview = (segments, authorId) => {
    // Metadata is always first, the rest is content
    const [metadata, ...contentSegments] = segments;
    let reviewObj = contentSegments.find(obj => obj.author.toLowerCase() === authorId);
    if (!reviewObj) {
        reviewObj = { author: authorId, review: '', tracks: [], score: { score: 0, max: 10, fraction: 0 } };
        segments.push(reviewObj);
    }
    return reviewObj;
};

const markdownToDelta = (str) => {
    const markdownInst = new markdownIt();
    const markdownTokens = markdownInst.parse(str);
    let isItalic = false;
    let isBold = false;
    let isLink = false;
    const newInsertion = () => {
        const block = { insert: '' };
        if (isItalic || isBold || isLink) {
            block.attributes = {};
        }
        if (isItalic === true) {
            block.attributes.italic = true;
        }
        if (isBold === true) {
            block.attributes.bold = true;
        }
        if (isLink !== false) {
            block.attributes.link = isLink;
        }
        return block;
    }
    const process = (acc, item) => {
        let lastItem = acc[acc.length - 1];
        switch (item.type) {
            case 'text':
                lastItem.insert += item.content;
                break;
            case 'softbreak':
                lastItem.insert += '\n';
                break;
            case 'heading_close':
                lastItem = newInsertion();
                lastItem.attributes = {};
                lastItem.attributes.header = Number(item.tag.substr(1));
                lastItem.insert = '\n';
                acc.push(lastItem);
                acc.push(newInsertion());
                break;
            case 'em_open':
                isItalic = true;
                if (lastItem.insert === '') {
                    lastItem.attributes.italic = true;
                    break;
                }
                acc.push(newInsertion());
                break;
            case 'strong_open':
                isBold = true;
                if (lastItem.insert === '') {
                    lastItem.attributes.bold = true;
                    break;
                }
                acc.push(newInsertion());
                break;
            case 'link_open':
                isLink = item.attrs.find(([key]) => key === 'href')[1];
                if (lastItem.insert === '') {
                    lastItem.attributes.link = isLink;
                    break;
                }
                acc.push(newInsertion());
                break;
            case 'em_close':
                isItalic = false;
                acc.push(newInsertion());
                break;
            case 'strong_close':
                isBold = false;
                acc.push(newInsertion());
                break;
            case 'link_close':
                isLink = false;
                acc.push(newInsertion());
                break;
            case 'paragraph_close':
                lastItem = newInsertion();
                acc.push(lastItem);
                lastItem.insert = '\n\n';
                break;
            case 'inline':
                item.children.reduce(process, acc);
                break;
        }
        return acc;
    };
    return markdownTokens.reduce(process, [{ insert: '' }]);
}

// TODO: Improve error handling
exports.handler = async function(event, context) {
    const payload = JSON.parse(event.body);
    const client = new Octokit({ auth: payload.token });
    const author = await getAuthor(client);
    if (!author) throw Error('Audioxide author could not be resolved from your GitHub user.');
    const ref = payload.branch;
    const fileList = await getContent(client, ref, 'data/posts');
    if (fileList.status > 299 || fileList.status < 200) return { statusCode: fileList.status };
    // We pluralise the branch name's post type as Fred tends to name branches with the singular
    const file = fileList.data.find(file => file.name.indexOf(ref) > -1 || file.name.indexOf(ref.replace(/^([^\-]+?)-/, '$1s-')) > -1);
    if (!file) return { statusCode: 404 };
    const fileContents = await getContent(client, ref, file.path);
    if (fileContents.status > 299 || fileContents.status < 200) return { statusCode: fileContents.status };
    const segments = parseContent(fileContents.data.content);
    const review = getReview(segments, author.id);
    review.review = markdownToDelta(review.review);
    return {
        statusCode: 200,
        body: JSON.stringify(review),
    };
};
