import { apiRequest } from "../api/client";

export function getPlans() {
  return apiRequest("subscription/plans");
}

export function getCurrentSubscription() {
  return apiRequest("subscription/current");
}

export function getBillingSummary() {
  return apiRequest("subscription/billing-summary");
}

export function changePlan(planId) {
  return apiRequest(`subscription/change-plan/${planId}`, {
    method: "POST"
  });
}
