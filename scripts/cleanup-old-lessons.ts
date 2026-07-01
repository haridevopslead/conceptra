import { db } from '../lib/db'

async function main() {
  // Delete old placeholder lessons that have no real content
  const slugsToDelete = [
    'k8s-rbac-network-hpa',
    'github-actions-intro',
    'jenkins-multistage-pipelines',
    'aws-ecs-vs-eks',
    'multi-cloud-architecture',
    'terraform-fundamentals',
    'terraform-modules-remote-state',
    'prometheus-grafana',
    'distributed-tracing-jaeger',
    'sre-principles-slo-sla',
    'incident-management'
  ]

  const deleted = await db.lesson.deleteMany({
    where: { slug: { in: slugsToDelete } }
  })

  console.log(`Deleted ${deleted.count} old placeholder lessons`)

  // Show remaining lessons
  const remaining = await db.lesson.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, title: true, tier: true }
  })

  console.log('Remaining lessons:')
  remaining.forEach(l => console.log(`${l.tier} - ${l.title}`))
}

main().catch(console.error).finally(() => db.$disconnect())
