import { apiRequest } from "../api/client";

export function getUsers() {
  return apiRequest("users");
}

export function createUser(payload) {
  const body = {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    password: payload.password,
    userRole: payload.userRole || payload.role,
    yearEnrolled: payload.yearEnrolled || null,
    yearLevel: payload.yearLevel || null,
    program: payload.program || null
  };
  return apiRequest("users", {
    method: "POST",
    body,
  });
}

export function updateUser(id, payload) {
  const body = {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    userRole: payload.userRole || payload.role,
    yearEnrolled: payload.yearEnrolled || null,
    yearLevel: payload.yearLevel || null,
    program: payload.program || null
  };
  return apiRequest(`users/${id}`, {
    method: "PUT",
    body,
  });
}

export function toggleUserStatus(id) {
  return apiRequest(`users/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export function deactivateUser(id) {
  return apiRequest(`users/${id}/toggle-status`, {
    method: "PATCH",
  });
}

export function unlockUser(id) {
  return apiRequest(`users/${id}/unlock`, {
    method: "PATCH",
  });
}

export function deleteUser(id) {
  return apiRequest(`users/${id}`, {
    method: "DELETE",
  });
}

export function getStudents() {
  return apiRequest("users/students");
}

export function getInstructors() {
  return apiRequest("users/instructors").then(res => res.data || res);
}

// Self profile update (firstName, lastName only)
export function updateProfile(payload) {
  return apiRequest("users/profile", {
    method: "PUT",
    body: payload,
  });
}

// Self change password (validates current password)
export function changeOwnPassword(currentPassword, newPassword) {
  return apiRequest("users/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

// Admin change user password
export function adminChangePassword(userId, newPassword) {
  return apiRequest(`users/${userId}/change-password`, {
    method: "PUT",
    body: { newPassword },
  });
}

// Upload profile photo
export function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  return apiRequest("users/profile-photo", {
    method: "PUT",
    body: formData,
    rawBody: true,
  });
}
