import { db } from '../lib/db'

async function main() {
  const lessons = await db.lesson.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, order: true, published: true, content: true }
  })

  const results = lessons.map((l) => {
    const raw = JSON.stringify(l.content)
    const isPlaceholder =
      raw.includes('placeholder') ||
      raw.includes('coming soon') ||
      raw.includes('TODO') ||
      raw.length < 200
    return {
      order: l.order,
      slug: l.slug,
      title: l.title,
      published: l.published,
      content: isPlaceholder ? 'PLACEHOLDER' : 'REAL',
      contentLength: raw.length,
    }
  })

  console.table(results)
}

main()
