import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/data/projects";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cover = project.images[0];
  const tags = project.stack.flatMap((g) => g.items).slice(0, 5);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-foreground/10 bg-card p-4 transition-colors hover:border-primary/50 md:p-6">
      {cover && (
        <div className="overflow-hidden rounded-2xl border border-foreground/10">
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            sizes="(min-width: 1152px) 1100px, 100vw"
            className="aspect-video w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-8">
        <p className="font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</p>
        <div className="space-y-3">
          <h3 className="font-display text-3xl font-bold md:text-4xl">
            <Link
              href={`/projects/${project.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {project.title}
            </Link>
          </h3>
          <p className="max-w-2xl text-muted">{project.summary}</p>
          <ul className="flex flex-wrap gap-2 pt-1">
            {tags.map((t) => (
              <li key={t} className="rounded-full border border-foreground/10 px-3 py-1 font-mono text-xs text-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full bg-primary text-background transition-transform group-hover:rotate-45"
        >
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function SelectedWork() {
  return (
    <section id="work" className="scroll-mt-28 border-t border-foreground/10 py-24">
      <p className="font-mono text-sm text-primary">{"//"} 01 – work</p>
      <h2 className="font-display text-4xl font-bold md:text-6xl">Selected Work</h2>
      <ul className="mt-12 grid gap-8">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <ProjectCard project={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
