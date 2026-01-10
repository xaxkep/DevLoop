export async function onRequest(context) {
    const { request, env, params } = context;
    const method = request.method;
    const id = params.id;

    if (method === 'PATCH') {
        // Update issue labels
        const body = await request.json();
        const { field, value } = body;

        // First, get current issue
        const getResponse = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevLoop-App'
            }
        });
        const issue = await getResponse.json();

        // Filter out old labels and add new
        const labels = issue.labels.map(l => l.name).filter(l => !['high', 'medium', 'low', 'easy', 'medium', 'hard'].includes(l));
        labels.push(value.toLowerCase());

        // Update issue
        const response = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'DevLoop-App'
            },
            body: JSON.stringify({ labels })
        });
        const updatedIssue = await response.json();
        return new Response(JSON.stringify(updatedIssue), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (method === 'DELETE') {
        // Close issue
        const response = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'DevLoop-App'
            },
            body: JSON.stringify({ state: 'closed' })
        });
        const issue = await response.json();
        return new Response(JSON.stringify(issue), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response('Method not allowed', { status: 405 });
    }
}