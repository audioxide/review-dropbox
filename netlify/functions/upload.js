const { Octokit }= require('@octokit/core');
const fetch = require('node-fetch');
const YAML = require('yaml');

YAML.scalarOptions.str.fold.lineWidth = 0;

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
        reviewObj = { author: authorId };
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
            let link = attributes.link;
            if (link.startsWith('http')) { // Simplistic check for an absolute URL
                const urlObj = new URL(link);
                if (urlObj.host.endsWith('audioxide.com')) {
                    link = urlObj.pathname;
                }
            }
            md =`[${md}](${link})`;
        }
        if (attributes.bold) {
            md = `**${md}**`;
        }
        if (attributes.italic) {
            md = `_${md}_`;
        }
        if (typeof attributes.header === 'number') {
            acc = acc.replace(/\n([^\n]+?)$/, `\n${"#".repeat(attributes.header)} $1`);
        }
    }
    return acc.concat(md);
}, '').replace(/(^|\s)"/g, "$1“").replace(/"/g, "”").replace(/'/g, "’").trim();

const uploadContent = (client, branch, path, sha, segments, author) => client.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    ...repoParams,
    branch,
    path,
    sha,
    message: `Content change by ${author.name}`,
    content: btoa('---\n' + segments.map(segment => YAML.stringify(segment)).join('\n---\n'))
});

// const retBlob = (data) => ({ statusCode: 200, body: JSON.stringify(data, null, 2) });

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
    const uploadResponse = await uploadContent(client, ref, file.path, fileContents.data.sha, segments, author);
    if (uploadResponse.status > 299 || uploadResponse.status < 200) return { statusCode: uploadResponse.status, body: JSON.stringify(uploadResponse) };
    return { statusCode: 200 };
};
