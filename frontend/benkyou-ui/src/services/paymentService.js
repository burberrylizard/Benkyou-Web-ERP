import { apiRequest } from "../api/client";

export const createCheckoutSession = async (planId, billingCycle) => {
    const tenantCode = localStorage.getItem("tenantCode") || "";
    const prefix = tenantCode ? `/${tenantCode}` : "";
    return apiRequest("payment/create-checkout-session", {
        method: "POST",
        body: {
            planId,
            billingCycle,
            successUrl: `${window.location.origin}${prefix}/admin/subscription/success`,
            cancelUrl: `${window.location.origin}${prefix}/admin/subscription/cancel`,
        }
    });
};
