export async function onRequest(context) {
    const { request, env, params } = context;
    const method = request.method;
    const id = params.id;

    if (method === 'PUT') {
        // Full item update: create new issue and close old one
        const body = await request.json();
        const { title, description, url, screenshots } = body;
        console.log('PUT request for issue', id, 'with updated data');

        // Get the current issue to preserve other data
        const getResponse = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevLoop-App'
            }
        });

        if (!getResponse.ok) {
            console.error('Failed to get current issue:', getResponse.status);
            return new Response('Failed to get current issue', { status: getResponse.status });
        }

        const currentIssue = await getResponse.json();
        const currentBody = currentIssue.body || '';

        // Extract existing data from body
        const nameMatch = currentBody.match(/Name:\s*(.+)/);
        const emailMatch = currentBody.match(/Email:\s*(.+)/);
        const createdAtMatch = currentBody.match(/Created At:\s*(.+)/);

        // Build new body
        let newBody = description || 'No description provided.';
        if (url) newBody += '\n\nURL: ' + url;
        if (screenshots && screenshots.length > 0) {
            newBody += '\n\nScreenshots: ' + screenshots.join('\n');
        }
        newBody += '\n\nCreated At: ' + (createdAtMatch ? createdAtMatch[1] : new Date().toISOString());
        if (nameMatch) newBody += '\n\nName: ' + nameMatch[1];
        if (emailMatch) newBody += '\n\nEmail: ' + emailMatch[1];

        // Create new issue
        const createResponse = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'DevLoop-App'
            },
            body: JSON.stringify({
                title: title,
                body: newBody,
                labels: currentIssue.labels.map(l => l.name) // Preserve existing labels
            })
        });

        if (!createResponse.ok) {
            console.error('Failed to create new issue:', createResponse.status, await createResponse.text());
            return new Response('Failed to create new issue', { status: createResponse.status });
        }

        const newIssue = await createResponse.json();
        console.log('Created new issue:', newIssue.number);

        // Close the old issue
        const closeResponse = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/issues/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'DevLoop-App'
            },
            body: JSON.stringify({
                state: 'closed',
                body: currentIssue.body + '\n\n---\n*This issue was updated and replaced by #' + newIssue.number + '*'
            })
        });

        if (!closeResponse.ok) {
            console.error('Failed to close old issue:', closeResponse.status);
            // Continue anyway, as the new issue was created successfully
        }

        return new Response(JSON.stringify(newIssue), {
            headers: { 'Content-Type': 'application/json' }
        });

    } else if (method === 'PATCH') {
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