import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { getProject, projects, SCREENSHOT_QUALITY } from "@/data/projects";
import { groupGallery, isPortrait, splitCover } from "@/lib/screenshots";
import { site } from "@/lib/site";
import { PhoneScreens } from "@/components/PhoneScreens";

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
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${project.title} — ${site.name}`,
      description: project.summary,
      url: `/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const { cover, gallery } = splitCover(project.images);
  const isPhoneCover = cover.length > 0 && isPortrait(cover[0]);
  const galleryBlocks = groupGallery(gallery);

  return (
    <article className="mx-auto w-[calc(100%-2rem)] max-w-6xl pb-12 pt-12">
      <Link
        href="/#work"
        className="tap-target inline-flex items-center gap-2 font-mono text-sm text-muted transition-colors hover:text-primary"
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
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground pressable hover:opacity-90"
            >
              Live site <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
          {project.links?.repos?.map((r) => (
            <a
              key={r.href}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-medium pressable hover:bg-foreground/5"
            >
              {r.label} <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          ))}
          {project.note && (
            <p className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 font-mono text-sm text-muted">
              {"//"} {project.note}
            </p>
          )}
        </div>
      </header>

      {cover.length > 0 && (
        <div className="mt-12 overflow-hidden rounded-3xl border border-foreground/10">
          {isPhoneCover ? (
            <PhoneScreens
              images={cover}
              sizes="(min-width: 1152px) 320px, (min-width: 640px) 30vw, 45vw"
              priority
              className="px-4 py-8 sm:px-10 sm:py-12"
              phoneClassName="w-[45%] max-w-[320px] sm:w-[30%]"
            />
          ) : (
            <Image
              src={cover[0].src}
              alt={cover[0].alt}
              width={cover[0].width}
              height={cover[0].height}
              sizes="(min-width: 1152px) 1100px, 100vw"
              quality={SCREENSHOT_QUALITY}
              priority
              className="w-full"
            />
          )}
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
          {"//"} Confidential client work. The code and live product aren&apos;t public, so the screenshots were
          taken against a local mock with made-up data.
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

      {galleryBlocks.length > 0 && (
        <section className="mt-16 grid gap-6" aria-label="Screenshots">
          {galleryBlocks.map((block) =>
            block.kind === "wide" ? (
              <div key={block.image.src} className="overflow-hidden rounded-3xl border border-foreground/10">
                <Image
                  src={block.image.src}
                  alt={block.image.alt}
                  width={block.image.width}
                  height={block.image.height}
                  sizes="(min-width: 1152px) 1100px, 100vw"
                  quality={SCREENSHOT_QUALITY}
                  className="w-full"
                />
              </div>
            ) : (
              // Phone screenshots: two per row on small screens, three from md up
              <div key={block.images[0].src} className="flex flex-wrap justify-center gap-6">
                {block.images.map((img) => (
                  <Image
                    key={img.src}
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    sizes="(min-width: 1152px) 360px, (min-width: 768px) 32vw, 48vw"
                    quality={SCREENSHOT_QUALITY}
                    className="h-auto w-[calc(50%-0.75rem)] rounded-3xl border border-foreground/10 md:w-[calc(33.333%-1rem)]"
                  />
                ))}
              </div>
            ),
          )}
        </section>
      )}

      {next && (
        <Link
          href={`/projects/${next.slug}`}
          className="group mt-20 flex items-center justify-between rounded-3xl border border-foreground/10 p-8 pressable hover:border-primary/50"
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
