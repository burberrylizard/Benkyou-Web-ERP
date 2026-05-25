import { apiRequest } from "../api/client";

export function getOrganizations() {
  return apiRequest("organization");
}

export function updateOrganizationStatus(id, isActive) {
  return apiRequest(`organization/${id}/status`, {
    method: "PATCH",
    body: { isActive }
  });
}

export function getMyOrganization() {
  return apiRequest("organization/me");
}

export function updateOrganizationType(organizationType) {
  return apiRequest("organization/me/type", {
    method: "PUT",
    body: { organizationType }
  });
}
