export enum ProjectStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
}

export enum ProjectVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
}

export const PROJECT_STATUSES = Object.values(ProjectStatus);
export const PROJECT_VISIBILITIES = Object.values(ProjectVisibility);
export type ProjectStatusValue = `${ProjectStatus}`;
export type ProjectVisibilityValue = `${ProjectVisibility}`;
