using Benkyou.Core.Services;
using Benkyou.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("stripe/webhooks")]
    public class StripeWebhookController : ControllerBase
    {
        private readonly StripeService _stripeService;
        private readonly BenkyouDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<StripeWebhookController> _logger;

        public StripeWebhookController(
            StripeService stripeService,
            BenkyouDbContext db,
            IConfiguration config,
            ILogger<StripeWebhookController> logger)
        {
            _stripeService = stripeService;
            _db = db;
            _config = config;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Handle()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var signatureHeader = Request.Headers["Stripe-Signature"];
            var webhookSecret = _config["Stripe:WebhookSecret"] ?? "";

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, webhookSecret);

                if (stripeEvent.Type == "invoice.payment_succeeded")
                {
                    var invoice = stripeEvent.Data.Object as Invoice;
                    if (invoice != null)
                    {
                        var subscription = await _db.Subscriptions
                            .FirstOrDefaultAsync(s => s.StripeCustomerId == invoice.CustomerId);

                        if (subscription != null)
                        {
                            subscription.Status = "Active";
                            subscription.UpdatedAt = DateTime.UtcNow;
                            await _db.SaveChangesAsync();

                            _logger.LogInformation(
                                "invoice.payment_succeeded: Subscription marked Active for customer {CustomerId}",
                                invoice.CustomerId);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "invoice.payment_succeeded: No subscription found for customer {CustomerId}",
                                invoice.CustomerId);
                        }
                    }
                }
                else if (stripeEvent.Type == "invoice.payment_failed")
                {
                    var invoice = stripeEvent.Data.Object as Invoice;
                    if (invoice != null)
                    {
                        var subscription = await _db.Subscriptions
                            .FirstOrDefaultAsync(s => s.StripeCustomerId == invoice.CustomerId);

                        if (subscription != null)
                        {
                            subscription.Status = "past_due";
                            subscription.UpdatedAt = DateTime.UtcNow;
                            await _db.SaveChangesAsync();

                            _logger.LogInformation(
                                "invoice.payment_failed: Subscription marked past_due for customer {CustomerId}",
                                invoice.CustomerId);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "invoice.payment_failed: No subscription found for customer {CustomerId}",
                                invoice.CustomerId);
                        }
                    }
                }
                else if (stripeEvent.Type == "customer.subscription.deleted")
                {
                    var stripeSubscription = stripeEvent.Data.Object as Stripe.Subscription;
                    if (stripeSubscription != null)
                    {
                        var subscription = await _db.Subscriptions
                            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscription.Id);

                        if (subscription != null)
                        {
                            subscription.Status = "canceled";
                            subscription.UpdatedAt = DateTime.UtcNow;
                            await _db.SaveChangesAsync();

                            _logger.LogInformation(
                                "customer.subscription.deleted: Subscription marked canceled for subscription ID {SubId}",
                                stripeSubscription.Id);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "customer.subscription.deleted: No subscription found for subscription ID {SubId}",
                                stripeSubscription.Id);
                        }
                    }
                }
                else if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                    if (session != null)
                    {
                        var tenantIdStr = session.Metadata?.GetValueOrDefault("tenantId");
                        var planIdStr = session.Metadata?.GetValueOrDefault("planId");

                        if (!string.IsNullOrEmpty(tenantIdStr) && Guid.TryParse(tenantIdStr, out var tenantId)
                            && !string.IsNullOrEmpty(planIdStr) && int.TryParse(planIdStr, out var planId))
                        {
                            var subscription = await _db.Subscriptions
                                .FirstOrDefaultAsync(s => s.TenantID == tenantId);

                            if (subscription == null)
                            {
                                subscription = new Benkyou.Data.Models.Subscription
                                {
                                    TenantID = tenantId,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _db.Subscriptions.Add(subscription);
                                _logger.LogInformation("checkout.session.completed: Created new subscription record for tenant {TenantId}", tenantId);
                            }

                            subscription.PlanID = planId;
                            subscription.Status = "Active";
                            subscription.StripeCustomerId = session.CustomerId;
                            subscription.StripeSubscriptionId = session.SubscriptionId;
                            subscription.UpdatedAt = DateTime.UtcNow;
                            await _db.SaveChangesAsync();

                            _logger.LogInformation(
                                "checkout.session.completed: Updated subscription for tenant {TenantId} to plan {PlanId}",
                                tenantId, planId);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "checkout.session.completed: Missing or invalid metadata. tenantId={TenantId}, planId={PlanId}",
                                tenantIdStr, planIdStr);
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe webhook signature validation failed.");
                return BadRequest("Webhook signature validation failed.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Stripe webhook.");
                return BadRequest();
            }
        }
    }
}
