import { apiRequest } from "../api/client";

export function getAnnouncements(courseId) {
  return apiRequest(`announcements/course/${courseId}`);
}

export function createAnnouncement(courseId, payload) {
  return apiRequest(`announcements/course/${courseId}`, {
    method: "POST",
    body: payload,
  });
}

export function replyToAnnouncement(announcementId, body) {
  return apiRequest(`announcements/${announcementId}/reply`, {
    method: "POST",
    body: { body },
  });
}
