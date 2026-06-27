import * as dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const lessons = [
  {
    slug: "docker-fundamentals",
    title: "Docker Fundamentals",
    description:
      "Master containers from the ground up: images, layers, volumes, networking, and multi-stage builds.",
    tier: "FREE" as const,
    order: 1,
    published: true,
    content: {
      layers: [
        {
          type: "story",
          title: "The 2AM 'Works on My Machine' Call",
          content:
            "It's 2AM. Your phone rings. The app that worked perfectly on your laptop for 3 weeks has just crashed in production. You SSH in. Different OS version. Different Python version. A library that exists on your machine doesn't exist on the server. The deployment engineer installed something manually 6 months ago and never documented it. You spend 4 hours not fixing a bug — fixing an environment. This is the problem Docker was built to eliminate.",
        },
        {
          type: "concept",
          title: "What Docker Actually Does",
          content:
            "Docker packages your application and everything it needs — the OS libraries, the runtime, the dependencies, the config — into a single unit called a container. Think of it like a shipping container. Before shipping containers, every port had different cranes, different loading methods, different standards. Chaos. After shipping containers, one standard box works on any ship, any port, any truck. Docker does the same for software. Your container runs identically on your laptop, on staging, and in production. The environment is no longer a variable.",
        },
        {
          type: "pressure_test",
          title: "Interview Pressure Test",
          content:
            "Interviewer: 'What is the difference between a Docker image and a Docker container?'\n\nWeak answer (6/10): 'An image is like a template and a container is a running instance of that image.'\n\nStrong answer (9/10): 'An image is an immutable, layered filesystem snapshot — it's built once and never changes. A container is a running process that uses that image as its root filesystem, with an additional writable layer on top. You can run 50 containers from one image simultaneously. When the container stops, its writable layer is discarded unless you commit it or use volumes. This is why containers are stateless by design — state belongs in volumes or external storage, not in the container itself.'\n\nSenior insight: The interviewer is checking whether you understand immutability. If you say containers are stateless and can explain WHY (the writable layer is ephemeral), you signal production experience. Most candidates skip the why.",
        },
      ],
    },
  },
];

async function main() {
  console.log("Seeding lessons…");

  for (const lesson of lessons) {
    const result = await db.lesson.upsert({
      where: { slug: lesson.slug },
      update: {
        title: lesson.title,
        description: lesson.description,
        tier: lesson.tier,
        order: lesson.order,
        published: lesson.published,
        content: lesson.content,
      },
      create: lesson,
    });
    console.log(`  ✓ Upserted: "${result.title}" (id: ${result.id})`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
