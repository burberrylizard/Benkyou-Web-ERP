using Benkyou.Core.Services;
using Benkyou.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/payment")]
[Authorize]
public class PaymentController(
    StripeService stripeService, 
    BenkyouDbContext db, 
    ILogger<PaymentController> logger) : ControllerBase
{
    private readonly StripeService _stripeService = stripeService;
    private readonly BenkyouDbContext _db = db;
    private readonly ILogger<PaymentController> _logger = logger;

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CheckoutRequest request)
    {
        var tenantIdClaim = User.FindFirst("tenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim)) return Unauthorized();
        var tenantId = Guid.Parse(tenantIdClaim);

        var email = User.FindFirst("email")?.Value ?? "";

        var plan = await _db.SubscriptionPlans.FindAsync(request.PlanId);
        if (plan == null) return NotFound("Plan not found");

        var priceId = request.BillingCycle == "Yearly" ? plan.StripePriceIdYearly : plan.StripePriceIdMonthly;
        var isMock = string.IsNullOrEmpty(priceId) || 
                     _stripeService.SecretKey == "YOUR_STRIPE_SECRET_KEY" || 
                     string.IsNullOrEmpty(_stripeService.SecretKey);

        if (isMock)
        {
            _logger.LogWarning(
                "No valid Stripe price ID found for plan {PlanId}. Using mock checkout for tenant {TenantId}.",
                request.PlanId, tenantId);

            var mockSessionId = "mock_sess_" + Guid.NewGuid().ToString("N");
            var mockUrl = $"{Request.Scheme}://{Request.Host}/api/payment/mock-checkout-success?tenantId={tenantId}&planId={request.PlanId}&successUrl={Uri.EscapeDataString(request.SuccessUrl)}";
            return Ok(new { sessionId = mockSessionId, url = mockUrl, isMock = true });
        }

        try
        {
            var subscription = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantID == tenantId);

            var session = await _stripeService.CreateCheckoutSessionAsync(
                email,
                priceId ?? "",
                request.SuccessUrl,
                request.CancelUrl,
                tenantId,
                request.PlanId,
                subscription?.StripeCustomerId
            );

            return Ok(new { sessionId = session.Id, url = session.Url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Stripe checkout session creation failed for tenant {TenantId}, plan {PlanId}. Falling back to mock.",
                tenantId, request.PlanId);

            var mockSessionId = "mock_sess_" + Guid.NewGuid().ToString("N");
            var mockUrl = $"{Request.Scheme}://{Request.Host}/api/payment/mock-checkout-success?tenantId={tenantId}&planId={request.PlanId}&successUrl={Uri.EscapeDataString(request.SuccessUrl)}";
            return Ok(new { sessionId = mockSessionId, url = mockUrl, isMock = true });
        }
    }

    [HttpGet("customer-portal")]
    public async Task<IActionResult> GetCustomerPortal([FromQuery] string returnUrl)
    {
        var tenantIdClaim = User.FindFirst("tenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim)) return Unauthorized();
        var tenantId = Guid.Parse(tenantIdClaim);

        var subscription = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantID == tenantId);
        if (subscription == null || string.IsNullOrEmpty(subscription.StripeCustomerId))
        {
            return BadRequest("No active Stripe customer found for this organization.");
        }

        var session = await _stripeService.CreateCustomerPortalSessionAsync(subscription.StripeCustomerId, returnUrl);
        return Ok(new { url = session.Url });
    }

    [HttpGet("mock-checkout-success")]
    [AllowAnonymous]
    public async Task<IActionResult> MockCheckoutSuccess([FromQuery] Guid tenantId, [FromQuery] int planId, [FromQuery] string successUrl)
    {
        var subscription = await _db.Subscriptions.FirstOrDefaultAsync(s => s.TenantID == tenantId);
        if (subscription == null)
        {
            subscription = new Benkyou.Data.Models.Subscription
            {
                TenantID = tenantId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Subscriptions.Add(subscription);
            _logger.LogInformation("MockCheckoutSuccess: Created new subscription record for tenant {TenantId}", tenantId);
        }

        subscription.PlanID = planId;
        subscription.Status = "Active";
        subscription.StripeSubscriptionId = "mock_sub_" + Guid.NewGuid().ToString("N");
        subscription.StripeCustomerId = "mock_cust_" + Guid.NewGuid().ToString("N");
        subscription.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Redirect(successUrl);
    }
}

public class CheckoutRequest
{
    public int PlanId { get; set; }
    public string BillingCycle { get; set; } = "Monthly"; // Monthly or Yearly
    public string SuccessUrl { get; set; } = "";
    public string CancelUrl { get; set; } = "";
}
