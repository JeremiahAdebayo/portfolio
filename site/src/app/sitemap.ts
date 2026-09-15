import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = [
    "",
    "/projects",
    "/research",
    "/about",
    "/resume",
    "/contact",
    "/world",
  ].map((r) => ({ url: `${base}${r}`, lastModified: new Date() }));
  const projectRoutes = projects.map((p) => ({
    url: `${base}/projects/${p.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...projectRoutes];
}
