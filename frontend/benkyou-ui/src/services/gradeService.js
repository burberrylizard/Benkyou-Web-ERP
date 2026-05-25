import { apiRequest } from "../api/client";

export function getMyGrades() {
  return apiRequest("grades/my-grades");
}

export function getInstructorGrades() {
  return apiRequest("grades/instructor-grades");
}

export function submitAssessment(payload) {
  return apiRequest("grades/submit", {
    method: "POST",
    body: payload
  });
}

