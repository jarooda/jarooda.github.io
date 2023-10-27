export function sortPosts (posts: any[]): any[] {
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )
}

export function filterDraftAndEn (posts: any[]): any[] {
  return posts.filter((post) => !post.data.draft && !post.data.en)
}

export function filterDraftAndTag (posts: any[], tag: string): any[] {
  return posts.filter((post) => !post.data.draft && post.data.tags?.includes(tag))
}

export function filterDraft (posts: any[]): any[] {
  return posts.filter((post) => !post.data.draft)
}