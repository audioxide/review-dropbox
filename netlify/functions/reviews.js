const { Octokit }= require('@octokit/core');

const client = new Octokit();

exports.handler = async function(event, context) {
    const result = await client.request('GET /repos/{owner}/{repo}/pulls', {
        owner: 'audioxide',
        repo: 'data'
    });
    if (result.status > 299 || result.status < 200) return { statusCode: result.status };
    const listing = result.data.filter(pr => pr.labels.some(({ name }) => name.indexOf('editable') !== -1)).map(pr => ({
        name: pr.title,
        id: pr.number,
        created: pr.created_at,
        branch: pr.head.ref
    }));
    return {
        statusCode: 200,
        body: JSON.stringify(listing)
    };
};