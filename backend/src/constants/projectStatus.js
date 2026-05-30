const ProjectStatus = Object.freeze({
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
});

const ProjectVisibility = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

module.exports = {
  ProjectStatus,
  ProjectVisibility,
  PROJECT_STATUSES: Object.freeze(Object.values(ProjectStatus)),
  PROJECT_VISIBILITIES: Object.freeze(Object.values(ProjectVisibility)),
};
