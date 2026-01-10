export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'GET') {
        // Get all issues
        const response = await fetch('https://api.github.com/repos/xaxkep/DevLoop/issues', {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const issues = await response.json();
        return new Response(JSON.stringify(issues), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (method === 'POST') {
        // Create new issue
        const body = await request.json();
        const response = await fetch('https://api.github.com/repos/xaxkep/DevLoop/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const issue = await response.json();
        return new Response(JSON.stringify(issue), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response('Method not allowed', { status: 405 });
    }
}