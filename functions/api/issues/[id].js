export async function onRequest(context) {
    const { request, env, params } = context;
    const method = request.method;
    const id = params.id;

    if (method === 'PATCH') {
        // Update issue labels
        const body = await request.json();
        const { field, value } = body;
        console.log('PATCH request for issue', id, 'field:', field, 'value:', value);

        // First, get current issue
        const getResponse = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevLoop-App'
            }
        });
        const issue = await getResponse.json();
        console.log('Current issue labels:', issue.labels ? issue.labels.map(l => l.name) : 'none');

        // Get current labels and update based on field
        let labels = issue.labels.map(l => l.name);

        if (field === 'status') {
            console.log('Updating status field');
            // Filter out old status labels
            labels = labels.filter(l => !l.startsWith('status:'));
            // Add new status label
            const statusValue = value.toLowerCase().replace(/ /g, '-');
            labels.push(`status:${statusValue}`);
            console.log('New labels for status update:', labels);
        } else if (field === 'feasibility') {
            labels = labels.filter(l => !['high', 'medium', 'low'].includes(l));
            if (value !== 'Unassessed') {
                labels.push(value.toLowerCase());
            }
        } else if (field === 'effort') {
            labels = labels.filter(l => !['easy', 'medium', 'hard'].includes(l));
            if (value !== 'Unassessed') {
                labels.push(value.toLowerCase());
            }
        }

        console.log('Updated labels for field:', field, labels);
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
        if (!response.ok) {
            console.error('GitHub API error:', response.status, await response.text());
            return new Response('GitHub API error', { status: response.status });
        }
        const updatedIssue = await response.json();
        console.log('PATCH response labels:', updatedIssue.labels ? updatedIssue.labels.map(l => l.name) : 'none');
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