import { apiRequest } from "../api/client";
import { getToken } from "../utils/session";
import { API_URL } from "../api/client";

// Get all tenant-scoped students
export function getOperatorStudents() {
  return apiRequest("operator/students");
}

// Create a single student account
export function createStudent(payload) {
  return apiRequest("operator/students", {
    method: "POST",
    body: payload,
  });
}

// Import students bulk CSV / Excel
export function importStudents(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("operator/students/import", {
    method: "POST",
    body: formData,
    rawBody: true,
  });
}

// Deactivate student
export function deactivateStudent(id) {
  return apiRequest(`operator/students/${id}/deactivate`, {
    method: "PUT",
  });
}

// Activate student
export function activateStudent(id) {
  return apiRequest(`operator/students/${id}/activate`, {
    method: "PUT",
  });
}

// Reset student password
export function resetStudentPassword(id, newPassword) {
  return apiRequest(`operator/students/${id}/reset-password`, {
    method: "PUT",
    body: { newPassword },
  });
}

// Get batch enrollment preview counts
export function getBatchEnrollPreview(courseId, filterProgram, filterYearLevel) {
  const params = new URLSearchParams();
  params.append("courseId", courseId);
  if (filterProgram) params.append("filterProgram", filterProgram);
  if (filterYearLevel) params.append("filterYearLevel", filterYearLevel);

  return apiRequest(`operator/batch-enroll/preview?${params.toString()}`);
}

// Perform batch enrollment
export function batchEnroll(courseId, filterProgram, filterYearLevel, classSectionId = null, excludedStudentIds = []) {
  return apiRequest("operator/batch-enroll", {
    method: "POST",
    body: {
      courseId,
      filterProgram: filterProgram || null,
      filterYearLevel: filterYearLevel || null,
      classSectionId: classSectionId || null,
      excludedStudentIds: excludedStudentIds || [],
    },
  });
}

// Get batch enrollment history logs
export function getBatchHistory() {
  return apiRequest("operator/batch-enroll/history");
}

// Get statistical reports summary
export function getEnrollmentSummary() {
  return apiRequest("operator/reports/enrollment-summary");
}

// Fetch report CSV blob for download
export async function downloadReportCsv() {
  const token = getToken();
  const url = `${API_URL}/operator/reports/export`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to export enrollment report CSV.");
  }
  return response.blob();
}
