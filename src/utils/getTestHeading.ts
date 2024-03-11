import { FullProject } from "@playwright/test";

export const getTestHeading = (
  fileName: string,
  os: NodeJS.Platform,
  project?: FullProject
) => {
  return `${fileName} (${os}${project?.name ? ` / ${project.name}` : ""})`;
};
