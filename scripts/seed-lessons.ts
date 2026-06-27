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
          title: "The 2AM call that changed how I think about deployments",
          content:
            "It's 2:17AM on a Tuesday. Your phone rings — it's the on-call alert. The payment service is down in production. You open your laptop, SSH into the server. Your first thought: this worked fine in staging an hour ago.\n\nYou start digging. Python version on the server: 3.8.2. Python version in staging: 3.10.4. A cryptography library your code uses behaves differently between the two. Someone installed Python 3.8 on the production server manually, six months ago, for a completely different service. Nobody documented it.\n\nYou spend the next four hours not fixing a bug. You're fixing an environment. The code was never the problem.\n\nThis scenario isn't rare. It's how most teams lose their weekends. And it's exactly the problem Docker was invented to eliminate.",
        },
        {
          type: "concept",
          title: "What Docker actually does — and the difference that matters most",
          content:
            "Docker packages your application into a container — a runnable unit that includes your app code, its runtime, its dependencies, and a minimal OS layer. The container runs the same way everywhere because it carries its environment with it.\n\nIMAGE vs CONTAINER — the distinction most engineers get wrong:\n\nAn IMAGE is a read-only template. Think of it as a blueprint. It's built once and never changes. Stored in a registry like Docker Hub or ECR. An image is never 'running' — it's a frozen snapshot.\n\nA CONTAINER is a running instance of an image. It has its own process, its own writable filesystem layer on top of the image, its own network interface. You can run 50 containers from one image simultaneously.\n\nThe critical production fact: when a container stops, its writable layer is discarded. Any data written inside the container is gone. This is intentional. Containers are stateless by design. State belongs in volumes or external storage — never in the container itself.\n\nTHE PRODUCTION MISTAKE 80% OF ENGINEERS MAKE:\n\nThey build images that are 1.5GB, 2GB, sometimes more. During a production incident when you need to scale fast, pulling a 2GB image takes 8-10 minutes. Your users are waiting. Your incident gets worse.\n\nThe fix is multi-stage builds:\n\n# WRONG - ships 1.4GB build tools into production\nFROM node:18\nCOPY . .\nRUN npm install && npm run build\nCMD [\"node\", \"dist/server.js\"]\n\n# RIGHT - only compiled output ships\nFROM node:18 AS builder\nCOPY package*.json .\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:18-alpine AS runtime\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nCMD [\"node\", \"dist/server.js\"]\n# Result: 180MB instead of 1.4GB",
        },
        {
          type: "pressure_test",
          title: "The interview questions that separate 6/10 answers from 9/10 answers",
          content:
            "QUESTION 1: What is the difference between a Docker image and a Docker container?\n\nWEAK (6/10): 'An image is like a template and a container is a running instance of that image.'\n\nSTRONG (9/10): 'An image is an immutable, layered filesystem snapshot — built once and never changed. A container is a running process that uses that image as its root filesystem, with a thin writable layer added on top. You can run 50 containers from one image simultaneously, each with their own isolated writable layer. When the container stops, that writable layer is discarded — which is why containers are stateless by design. Persistent data belongs in volumes or external storage, not in the container itself.'\n\nSENIOR INSIGHT: The 9/10 answer signals production experience because it explains WHY the writable layer is ephemeral and what that means for data. Most candidates say containers are stateless without understanding the mechanism.\n\n---\n\nQUESTION 2: Why is your Docker image 1.8GB? How would you reduce it?\n\nWEAK (6/10): 'I would use a smaller base image like Alpine Linux.'\n\nSTRONG (9/10): 'A 1.8GB image usually means build tools are being shipped into production. I would use a multi-stage build — compile in a full image, copy only the output into a minimal runtime image like Alpine or distroless. I would also add a .dockerignore to exclude node_modules, tests, and docs. In my last role this brought a 1.4GB Node image down to 180MB, which made a real difference during incident scale-up.'\n\nSENIOR INSIGHT: The line that changes the interview — mentioning the production consequence (slow image pull during incidents means users wait longer) shows systems thinking. Interviewers at Razorpay, PhonePe, and Swiggy specifically look for this.\n\nFOLLOW-UP PROBES:\n- What is the difference between CMD and ENTRYPOINT?\n- What happens to data written inside a container when it restarts?\n- How do you pass environment variables securely to a container?\n- What is a Docker volume and when would you use one over a bind mount?\n- Why would you use docker-compose in development but not in production?",
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
