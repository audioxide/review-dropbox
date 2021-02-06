const { Octokit }= require('@octokit/core');
const YAML = require('yaml');

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

const getContent = (client, ref, path) => client.request('GET /repos/{owner}/{repo}/contents/{path}', {
    ...repoParams,
    ref,
    path,
});

// TODO: Make this dynamic
const author = 'andrew';
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

const getReview = (segments) => {
    // Metadata is always first, the rest is content
    const [metadata, ...contentSegments] = segments;
    let reviewObj = contentSegments.find(obj => obj.author.toLowerCase() === author.toLowerCase());
    if (!reviewObj) {
        reviewObj = { author };
        segments.push(reviewObj);
    }
    return reviewObj;
};

const deltaToMarkdown = (deltaData) => deltaData.ops.reduce((acc, { attributes, insert }) => {
    // TODO: Handle this better, these are usually images
    if (typeof insert === 'object') return acc;
    let md = insert;
    if (attributes) {
        if (attributes.link) {
            md =`[${md}](${attributes.link})`;
        }
        if (attributes.bold) {
            md = `**${md}**`;
        }
        if (attributes.italic) {
            md = `_${md}_`;
        }
        if (attributes.header === 1) {
            md = "\n==========" + md;
        }
        if (attributes.header === 2) {
            md = "\n----------" + md;
        }
    }
    return acc.concat(md);
}, '').replace(/(^|\s)"/g, "“").replace(/"/g, "”").replace(/'/g, "’").trim();

const uploadContent = (client, branch, path, segments) => client.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    ...repoParams,
    branch,
    path,
    message: `Content change by ${author}`,
    content: btoa('---\n' + segments.map(segment => YAML.stringify(segment)).join('\n---\n'))
});

exports.handler = async function(event, context) {
    const payload = JSON.parse(event.body);
    const client = new Octokit({ auth: payload.token });
    const ref = payload.branch;
    const fileList = await getContent(client, ref, 'data/posts');
    if (fileList.status > 299 || fileList.status < 200) return { statusCode: fileList.status };
    const file = fileList.data.find(file => file.name.indexOf(ref) > -1);
    if (!file) return { statusCode: 404 };
    const fileContents = await getContent(ref, file.path);
    if (fileContents.status > 299 || fileContents.status < 200) return { statusCode: fileContents.status };
    const segments = parseContent(fileContents.data.content);
    const review = getReview(segments);
    review.tracks = payload.tracks;
    review.score = {
        score: payload.score,
        max: 10,
        fraction: payload.score/10
    };
    review.review = deltaToMarkdown(payload.content);

    /* return {
        statusCode: 200,
        body: JSON.stringify({
            ref,
            path: file.path,
            content: '---\n' + segments.map(segment => YAML.stringify(segment)).join('\n---\n')
        }),
    }; */
    const uploadResponse = await uploadContent(client, ref, file.path, segments);
    if (uploadResponse.status > 299 || uploadResponse.status < 200) return { statusCode: uploadResponse.status, body: JSON.stringify(uploadResponse) };
    return { statusCode: 200 };
};
