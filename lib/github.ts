const GITHUB_API = 'https://api.github.com'

export interface RepoFile {
  path: string
  content: string
}

export interface CreateRepoResult {
  success: boolean
  repoUrl?: string
  error?: string
}

export async function createRepo(name: string, description: string): Promise<CreateRepoResult> {
  const token = process.env.GITHUB_TOKEN
  const username = process.env.GITHUB_USERNAME || 'Tarrah4Tammwe'

  if (!token) return { success: false, error: 'GitHub token not configured' }

  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err.message || 'Failed to create repo' }
  }

  const data = await res.json()
  return { success: true, repoUrl: data.html_url }
}

export async function pushFilesToRepo(
  repoName: string,
  files: RepoFile[],
  commitMessage = 'Initial commit — Site Factory build'
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.GITHUB_TOKEN
  const username = process.env.GITHUB_USERNAME || 'Tarrah4Tammwe'

  if (!token) return { success: false, error: 'GitHub token not configured' }

  // Get the default branch SHA
  const refRes = await fetch(
    `${GITHUB_API}/repos/${username}/${repoName}/git/refs/heads/main`,
    { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
  )

  let baseTreeSha: string
  let parentSha: string

  if (refRes.ok) {
    const refData = await refRes.json()
    parentSha = refData.object.sha

    const commitRes = await fetch(
      `${GITHUB_API}/repos/${username}/${repoName}/git/commits/${parentSha}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    const commitData = await commitRes.json()
    baseTreeSha = commitData.tree.sha
  } else {
    return { success: false, error: 'Could not get repo ref' }
  }

  // Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(
        `${GITHUB_API}/repos/${username}/${repoName}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      )
      const blobData = await blobRes.json()
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      }
    })
  )

  // Create tree
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${username}/${repoName}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    }
  )
  const treeData = await treeRes.json()

  // Create commit
  const newCommitRes = await fetch(
    `${GITHUB_API}/repos/${username}/${repoName}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [parentSha],
      }),
    }
  )
  const newCommitData = await newCommitRes.json()

  // Update ref
  const updateRefRes = await fetch(
    `${GITHUB_API}/repos/${username}/${repoName}/git/refs/heads/main`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ sha: newCommitData.sha }),
    }
  )

  if (!updateRefRes.ok) {
    return { success: false, error: 'Failed to update ref' }
  }

  return { success: true }
}

export function generateRepoName(siteName: string): string {
  return siteName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
