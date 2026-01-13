export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method === 'GET') {
    // Return current user email from Cloudflare Access header
    const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || 'dev-mode@localhost';
    return Response.json({ email: userEmail });
  } else if (method === 'POST') {
    const { username, password } = await request.json();

    if (username === context.env.ADMIN_USERNAME && password === context.env.ADMIN_PASSWORD) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false }, { status: 401 });
    }
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}