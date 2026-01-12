export async function onRequest(context) {
  const { request } = context;
  const { username, password } = await request.json();

  if (username === context.env.ADMIN_USERNAME && password === context.env.ADMIN_PASSWORD) {
    return Response.json({ success: true });
  } else {
    return Response.json({ success: false }, { status: 401 });
  }
}