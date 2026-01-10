export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (method === 'POST') {
        const body = await request.json();
        const { filename, content } = body;

        const response = await fetch(`https://api.github.com/repos/xaxkep/DevLoop/contents/images/${filename}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'DevLoop-App'
            },
            body: JSON.stringify({
                message: 'Upload screenshot',
                content: content
            })
        });

        if (response.ok) {
            const result = await response.json();
            return new Response(JSON.stringify({ url: `https://raw.githubusercontent.com/xaxkep/DevLoop/main/images/${filename}` }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response('Upload failed', { status: 500 });
        }
    } else {
        return new Response('Method not allowed', { status: 405 });
    }
}