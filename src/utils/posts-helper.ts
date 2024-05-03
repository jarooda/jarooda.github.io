export function sortPosts (posts: any[]): any[] {
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )
}

export function filterEnPost (posts: any[]): any[] {
  return posts.filter((post) => !post.data.en)
}
