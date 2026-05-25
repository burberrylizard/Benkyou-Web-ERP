import { apiRequest } from "../api/client";

export function getClassSections(courseId) {
  return apiRequest(`class-sections/course/${courseId}`);
}

export function createClassSection(payload) {
  return apiRequest("class-sections", {
    method: "POST",
    body: payload,
  });
}

export function deleteClassSection(id) {
  return apiRequest(`class-sections/${id}`, {
    method: "DELETE",
  });
}

export function updateClassSection(id, payload) {
  return apiRequest(`class-sections/${id}`, {
    method: "PUT",
    body: payload,
  });
}
