import { apiRequest } from "../api/client";

export function getCategories() {
  return apiRequest("categories");
}

export function createCategory(payload) {
  return apiRequest("categories", {
    method: "POST",
    body: payload,
  });
}
