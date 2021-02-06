const { createAppAuth } = require("@octokit/auth-app");

const auth = createAppAuth({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
});

const redirectObj = {
    status: 302,
    headers: {
        location: '/'
    }
};

const redirect = (token) => {
    const response = { ...redirectObj };
    if (!token) return response;
    response.headers["Set-Cookie"] = `github-token=${token}`;
    return response;
};

exports.handler = async function(event, context) {
    const payload = JSON.parse(event.body);
    if (!('code' in payload)) return redirect();
    const { code } = payload;
    const oauthAuthentication = await auth({ type: 'oauth', code });
    return redirect(oauthAuthentication.token);
};