import { apiRequest } from "../api/client";

export function getEnrollments() {
  return apiRequest("enrollments");
}

export function getMyCourses() {
  return apiRequest("enrollments/my-courses");
}

export function enrollInCourse(courseID) {
  return apiRequest("enrollments", {
    method: "POST",
    body: { courseID },
  });
}

export function adminEnroll(studentID, courseID, classSectionID = null) {
  return apiRequest("enrollments/admin-enroll", {
    method: "POST",
    body: { studentID, courseID, classSectionID },
  });
}

export function unenrollStudent(courseId, studentId) {
  return apiRequest(`enrollments/course/${courseId}/student/${studentId}`, {
    method: "DELETE",
  });
}

export function getCourseContent(courseId) {
  return apiRequest(`enrollments/course/${courseId}/content`);
}

export function getEnrollmentRequests() {
  return apiRequest("enrollments/requests");
}

export function submitEnrollmentRequest(courseID) {
  return apiRequest("enrollments/request", {
    method: "POST",
    body: { courseID },
  });
}

export function approveEnrollmentRequest(id, classSectionId = null) {
  const url = classSectionId 
    ? `enrollments/requests/${id}/approve?classSectionId=${classSectionId}` 
    : `enrollments/requests/${id}/approve`;
  return apiRequest(url, {
    method: "PUT",
  });
}

export function rejectEnrollmentRequest(id, rejectionReason) {
  return apiRequest(`enrollments/requests/${id}/reject`, {
    method: "PUT",
    body: { rejectionReason },
  });
}
