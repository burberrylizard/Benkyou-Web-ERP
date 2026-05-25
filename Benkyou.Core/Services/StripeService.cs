using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Benkyou.Core.Services
{
    public class StripeService
    {
        private readonly string _secretKey;
        private readonly BenkyouDbContext _db;
        private readonly IConfiguration _config;

        public StripeService(IConfiguration config, BenkyouDbContext db)
        {
            _secretKey = config["Stripe:SecretKey"] ?? "";
            _db = db;
            _config = config;
        }

        public string SecretKey => _secretKey;

        private string ResolvePriceId(string planName)
        {
            if (string.IsNullOrEmpty(planName))
            {
                return _config["Stripe:Plans:Basic"] ?? "";
            }

            // If a raw price ID is passed directly, return it as-is
            if (planName.StartsWith("price_", StringComparison.OrdinalIgnoreCase))
            {
                return planName;
            }

            // Resolve planName (Basic, Professional, Enterprise) from the config Plans section
            var priceId = _config[$"Stripe:Plans:{planName}"];
            
            if (string.IsNullOrEmpty(priceId))
            {
                // Fallback to case-insensitive key search
                var plansSection = _config.GetSection("Stripe:Plans");
                foreach (var child in plansSection.GetChildren())
                {
                    if (string.Equals(child.Key, planName, StringComparison.OrdinalIgnoreCase))
                    {
                        priceId = child.Value;
                        break;
                    }
                }
            }

            if (string.IsNullOrEmpty(priceId))
            {
                // Ultimate fallback
                priceId = _config["Stripe:Plans:Basic"] ?? "";
            }

            return priceId;
        }

        public async Task<Customer> CreateCustomerAsync(Guid tenantId, string email, string name)
        {
            var options = new CustomerCreateOptions
            {
                Email = email,
                Name = name,
                Metadata = new Dictionary<string, string>
                {
                    { "tenantId", tenantId.ToString() }
                }
            };

            var client = new StripeClient(_secretKey);
            var service = new CustomerService(client);
            var customer = await service.CreateAsync(options);

            var org = await _db.Organizations.FirstOrDefaultAsync(o => o.TenantID == tenantId);
            if (org != null)
            {
                org.StripeCustomerId = customer.Id;
                await _db.SaveChangesAsync();
            }

            return customer;
        }

        public async Task<Stripe.Subscription> CreateSubscriptionAsync(string stripeCustomerId, string planName)
        {
            var priceId = ResolvePriceId(planName);

            var options = new SubscriptionCreateOptions
            {
                Customer = stripeCustomerId,
                Items = new List<SubscriptionItemOptions>
                {
                    new SubscriptionItemOptions
                    {
                        Price = priceId
                    }
                }
            };

            var client = new StripeClient(_secretKey);
            var service = new SubscriptionService(client);
            var subscription = await service.CreateAsync(options);

            var org = await _db.Organizations.FirstOrDefaultAsync(o => o.StripeCustomerId == stripeCustomerId);
            if (org != null)
            {
                org.StripeSubscriptionId = subscription.Id;
                org.SubscriptionStatus = subscription.Status; // active, past_due, canceled, incomplete
                await _db.SaveChangesAsync();
            }

            return subscription;
        }

        public async Task<Stripe.Subscription> CancelSubscriptionAsync(string stripeSubscriptionId)
        {
            var client = new StripeClient(_secretKey);
            var service = new SubscriptionService(client);
            var subscription = await service.CancelAsync(stripeSubscriptionId);

            var org = await _db.Organizations.FirstOrDefaultAsync(o => o.StripeSubscriptionId == stripeSubscriptionId);
            if (org != null)
            {
                org.SubscriptionStatus = "canceled";
                await _db.SaveChangesAsync();
            }

            return subscription;
        }

        public async Task<string> GetSubscriptionStatusAsync(string stripeSubscriptionId)
        {
            var client = new StripeClient(_secretKey);
            var service = new SubscriptionService(client);
            var subscription = await service.GetAsync(stripeSubscriptionId);
            return subscription.Status; // returns e.g. active, past_due, canceled
        }

        public async Task<string> CreateCheckoutSessionAsync(string stripeCustomerId, string planName, string successUrl, string cancelUrl)
        {
            var priceId = ResolvePriceId(planName);

            var options = new SessionCreateOptions
            {
                Customer = stripeCustomerId,
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1
                    }
                },
                Mode = "subscription",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl
            };

            var client = new StripeClient(_secretKey);
            var service = new SessionService(client);
            var session = await service.CreateAsync(options);
            return session.Url;
        }

        // Overload to maintain backward compatibility with existing PaymentController
        public async Task<Session> CreateCheckoutSessionAsync(
            string customerEmail,
            string priceId,
            string successUrl,
            string cancelUrl,
            Guid tenantId,
            int planId,
            string? stripeCustomerId = null)
        {
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1,
                    },
                },
                Mode = "subscription",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "tenantId", tenantId.ToString() },
                    { "planId", planId.ToString() }
                }
            };

            if (!string.IsNullOrEmpty(stripeCustomerId))
            {
                options.Customer = stripeCustomerId;
            }
            else
            {
                options.CustomerEmail = customerEmail;
            }

            var client = new StripeClient(_secretKey);
            var service = new SessionService(client);
            return await service.CreateAsync(options);
        }

        // Method to maintain backward compatibility with existing PaymentController
        public async Task<Stripe.BillingPortal.Session> CreateCustomerPortalSessionAsync(string customerId, string returnUrl)
        {
            var options = new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = customerId,
                ReturnUrl = returnUrl,
            };

            var client = new StripeClient(_secretKey);
            var service = new Stripe.BillingPortal.SessionService(client);
            return await service.CreateAsync(options);
        }
    }
}
