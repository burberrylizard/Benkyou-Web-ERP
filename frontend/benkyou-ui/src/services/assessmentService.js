import { apiRequest } from "../api/client";

// ── Assessment CRUD ──
export function getAssessments() {
  return apiRequest("assessments");
}

export function getAssessmentById(id) {
  return apiRequest(`assessments/${id}`);
}

export function createAssessment(data) {
  return apiRequest("assessments", {
    method: "POST",
    body: data
  });
}

export function deleteAssessment(id) {
  return apiRequest(`assessments/${id}`, {
    method: "DELETE"
  });
}

export function updateAssessmentSettings(id, data) {
  return apiRequest(`assessments/${id}/settings`, {
    method: "PUT",
    body: data
  });
}

export function publishAssessment(id) {
  return apiRequest(`assessments/${id}/publish`, {
    method: "PUT"
  });
}

// ── Question CRUD ──
export function addQuestion(assessmentId, data) {
  return apiRequest(`assessments/${assessmentId}/questions`, {
    method: "POST",
    body: data
  });
}

export function updateQuestion(questionId, data) {
  return apiRequest(`assessments/questions/${questionId}`, {
    method: "PUT",
    body: data
  });
}

export function deleteQuestion(questionId) {
  return apiRequest(`assessments/questions/${questionId}`, {
    method: "DELETE"
  });
}

// ── Student Attempt ──
export function startAttempt(assessmentId) {
  return apiRequest(`assessments/${assessmentId}/attempt`, {
    method: "POST"
  });
}

export function submitAttempt(attemptId, answers) {
  return apiRequest(`attempts/${attemptId}/submit`, {
    method: "POST",
    body: { answers }
  });
}

export function getAttemptResult(attemptId) {
  return apiRequest(`attempts/${attemptId}/result`);
}

// ── Instructor Grading ──
export function gradeEssay(answerId, score, feedback) {
  return apiRequest(`attempts/answers/${answerId}/grade`, {
    method: "PUT",
    body: { score, feedback }
  });
}

export function getPendingReviewAttempts() {
  return apiRequest("attempts/pending-review");
}

export function getAttemptReview(attemptId) {
  return apiRequest(`attempts/${attemptId}/review`);
}

export function gradeEssayAnswer(answerId, score, feedback) {
  return apiRequest(`attempts/answers/${answerId}/grade`, {
    method: "PUT",
    body: { score, feedback }
  });
}
