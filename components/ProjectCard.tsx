import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

export default function ProjectCard({
  project,
  ratio = "4 / 3",
  sizes = "(max-width: 900px) 100vw, 33vw",
  priority,
}: {
  project: Project;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Link href={`/our-works/${project.slug}`} className="group flex flex-col gap-3.5">
      <div className="card-img" style={{ aspectRatio: ratio }}>
        <Image src={project.cover.src} alt={project.cover.alt} fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
      {(project.layout || project.style) && (
        <p className="flex flex-wrap gap-2.5 text-[13px] tracking-[0.04em] text-muted">
          {project.layout && <span>{project.layout}</span>}
          {project.layout && project.style && <span aria-hidden="true">·</span>}
          {project.style && <span>{project.style}</span>}
          {project.location && (
            <>
              <span aria-hidden="true">·</span>
              <span>{project.location}</span>
            </>
          )}
        </p>
      )}
      <h3 className="display h-md decoration-1 underline-offset-4 group-hover:underline">{project.title}</h3>
    </Link>
  );
}
