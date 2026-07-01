import { db } from '../lib/db'

async function main() {
  // FREE lessons - teaser quality to show value
  await db.lesson.updateMany({
    where: { slug: { in: ['docker-fundamentals', 'kubernetes-architecture'] } },
    data: { tier: 'FREE' }
  })

  // PRO lessons - locked behind paywall
  await db.lesson.updateMany({
    where: { slug: { in: [
      'cicd-pipelines',
      'aws-fundamentals',
      'terraform-iac',
      'linux-fundamentals',
      'git-version-control',
      'observability-monitoring'
    ]}},
    data: { tier: 'PRO' }
  })

  // Confirm final state
  const lessons = await db.lesson.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, tier: true }
  })

  console.log('Final lesson tiers:')
  lessons.forEach(l => console.log(`${l.tier} - ${l.title}`))
}

main().catch(console.error).finally(() => db.$disconnect())
