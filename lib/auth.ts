export function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const password = process.env.FACTORY_PASSWORD

  if (!password) return false

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return token === password
  }

  return false
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
