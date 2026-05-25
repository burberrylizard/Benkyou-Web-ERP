import { apiRequest } from "../api/client";

export function getCourses() {
  return apiRequest("courses");
}

export function getCourseById(id) {
  return apiRequest(`courses/${id}`);
}

export function createCourse(payload) {
  return apiRequest("courses", {
    method: "POST",
    body: payload,
  });
}

export function togglePublish(courseId) {
  return apiRequest(`courses/${courseId}/publish`, {
    method: "PATCH",
  });
}

export function toggleCourseHide(courseId) {
  return apiRequest(`courses/${courseId}/hide`, {
    method: "PATCH",
  });
}

export function updateCourseStatus(courseId, status) {
  return apiRequest(`courses/${courseId}/status`, {
    method: "PUT",
    body: { status },
  });
}

export function getSections(courseId) {
  return apiRequest(`sections/course/${courseId}`);
}

export function createSection(payload) {
  return apiRequest("sections", {
    method: "POST",
    body: payload,
  });
}

export function getContentBySection(sectionId) {
  return apiRequest(`content/section/${sectionId}`);
}

export function createContent(payload) {
  return apiRequest("content", {
    method: "POST",
    body: payload,
  });
}

export function uploadContentFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  return apiRequest("content/upload", {
    method: "POST",
    body: formData,
    rawBody: true,
  });
}

export function toggleContentHide(contentId) {
  return apiRequest(`content/${contentId}/hide`, {
    method: "PATCH",
  });
}

export function deleteContent(contentId) {
  return apiRequest(`content/${contentId}`, {
    method: "DELETE",
  });
}

export function getCategories() {
  return apiRequest("categories");
}

export function createCategory(payload) {
  return apiRequest("categories", {
    method: "POST",
    body: payload,
  });
}

export function getCourseRoster(courseId) {
  return apiRequest(`courses/${courseId}/roster`);
}
