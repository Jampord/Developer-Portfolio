import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { getProject, projects } from "@/data/projects";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — John Ford Actub`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const cover = project.images[0];
  const gallery = project.images.slice(1);

  return (
    <article className="mx-auto w-[calc(100%-2rem)] max-w-6xl pb-12 pt-12">
      <Link
        href="/#work"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to work
      </Link>

      <header className="mt-8 space-y-6">
        <h1 className="font-display text-[clamp(3rem,9vw,7rem)] font-extrabold leading-[0.95] tracking-tight">
          {project.title}
        </h1>
        <p className="max-w-3xl text-xl text-muted">{project.summary}</p>

        <div className="flex flex-wrap gap-3">
          {project.links?.live && (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={project.links.live}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Live site <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
          {project.links?.repo && (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={project.links.repo}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              Source code <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </header>

      {cover && (
        <div className="mt-12 overflow-hidden rounded-3xl border border-foreground/10">
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            sizes="(min-width: 1152px) 1100px, 100vw"
            priority
            className="w-full"
          />
        </div>
      )}

      <dl className="mt-12 grid gap-6 border-y border-foreground/10 py-8 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <dt className="font-mono text-xs text-primary">{"//"} client</dt>
          <dd className="mt-1">{project.client}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs text-primary">{"//"} role</dt>
          <dd className="mt-1">{project.role}</dd>
        </div>
        {project.year && (
          <div>
            <dt className="font-mono text-xs text-primary">{"//"} year</dt>
            <dd className="mt-1">{project.year}</dd>
          </div>
        )}
      </dl>

      {project.confidential && (
        <p className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 font-mono text-sm text-muted">
          {"//"} Confidential client work. The code and live product aren&apos;t public, and the screenshots have
          sensitive data removed.
        </p>
      )}

      <div className="mt-16 grid gap-16">
        <section className="grid gap-4 md:grid-cols-[12rem_1fr] md:gap-12">
          <h2 className="font-mono text-sm text-primary">{"//"} 01 – problem</h2>
          <p className="max-w-3xl text-lg">{project.problem}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-[12rem_1fr] md:gap-12">
          <h2 className="font-mono text-sm text-primary">{"//"} 02 – approach</h2>
          <div className="grid max-w-3xl gap-10">
            {project.approach.map((a) => (
              <div key={a.title}>
                <h3 className="font-display text-2xl font-bold">{a.title}</h3>
                <p className="mt-2 text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[12rem_1fr] md:gap-12">
          <h2 className="font-mono text-sm text-primary">{"//"} 03 – outcome</h2>
          <p className="max-w-3xl text-lg">{project.outcome}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-[12rem_1fr] md:gap-12">
          <h2 className="font-mono text-sm text-primary">{"//"} stack</h2>
          <div className="grid max-w-3xl gap-4">
            {project.stack.map((g) => (
              <div key={g.group} className="flex flex-wrap items-center gap-2">
                <span className="w-40 shrink-0 font-mono text-xs text-muted">{g.group}</span>
                <ul className="flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <li key={item} className="rounded-full border border-foreground/10 px-3 py-1 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {gallery.length > 0 && (
        <section className="mt-16 grid gap-6" aria-label="Screenshots">
          {gallery.map((img) => (
            <div key={img.src} className="overflow-hidden rounded-3xl border border-foreground/10">
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(min-width: 1152px) 1100px, 100vw"
                className="w-full"
              />
            </div>
          ))}
        </section>
      )}

      {next && (
        <Link
          href={`/projects/${next.slug}`}
          className="group mt-20 flex items-center justify-between rounded-3xl border border-foreground/10 p-8 transition-colors hover:border-primary/50"
        >
          <span>
            <span className="font-mono text-sm text-primary">{"//"} next project</span>
            <span className="mt-1 block font-display text-3xl font-bold md:text-5xl">{next.title}</span>
          </span>
          <ArrowUpRight className="size-8 transition-transform group-hover:rotate-45" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
