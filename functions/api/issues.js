export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    // Debug: Check if token is set
    if (!env.GITHUB_TOKEN) {
        return new Response('GITHUB_TOKEN not set', { status: 500 });
    }

    if (method === 'GET') {
        // Get all issues
        try {
            const response = await fetch('https://api.github.com/repos/xaxkep/DevLoop/issues', {
                headers: {
                    'Authorization': `token ${env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (!response.ok) {
                const text = await response.text();
                return new Response('GitHub API error: ' + response.status + ' ' + text, { status: 500 });
            }
            const issues = await response.json();
            return new Response(JSON.stringify(issues), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            return new Response('Fetch error: ' + e.message, { status: 500 });
        }
    } else if (method === 'POST') {
        // Create new issue
        const body = await request.json();
        try {
            const response = await fetch('https://api.github.com/repos/xaxkep/DevLoop/issues', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const text = await response.text();
                return new Response('GitHub API error: ' + response.status + ' ' + text, { status: 500 });
            }
            const issue = await response.json();
            return new Response(JSON.stringify(issue), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            return new Response('Fetch error: ' + e.message, { status: 500 });
        }
    } else {
        return new Response('Method not allowed', { status: 405 });
    }
}