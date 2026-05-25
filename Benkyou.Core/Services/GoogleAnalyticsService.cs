using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Sends server-side events to Google Analytics 4 via the Measurement Protocol API.
    /// Each event includes tenant_id as a custom parameter to identify which tenant triggered it.
    /// Tracks: course_enrolled, course_completed, quiz_attempted.
    /// </summary>
    public class GoogleAnalyticsService
    {
        private readonly HttpClient _httpClient;
        private readonly string _measurementId;
        private readonly string _apiSecret;
        private readonly ILogger<GoogleAnalyticsService> _logger;

        private const string GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

        public GoogleAnalyticsService(
            HttpClient httpClient,
            IConfiguration config,
            ILogger<GoogleAnalyticsService> logger)
        {
            _httpClient = httpClient;
            _measurementId = config["GoogleAnalytics:MeasurementId"] ?? "";
            _apiSecret = config["GoogleAnalytics:ApiSecret"] ?? "";
            _logger = logger;
        }

        /// <summary>
        /// Tracks a course_enrolled event.
        /// </summary>
        public Task TrackCourseEnrolledAsync(
            string clientId, Guid tenantId, Guid userId, Guid courseId, string? courseName = null)
        {
            return SendEventAsync("course_enrolled", clientId, new Dictionary<string, object>
            {
                { "tenant_id", tenantId.ToString() },
                { "user_id", userId.ToString() },
                { "course_id", courseId.ToString() },
                { "course_name", courseName ?? "" }
            });
        }

        /// <summary>
        /// Tracks a course_completed event.
        /// </summary>
        public Task TrackCourseCompletedAsync(
            string clientId, Guid tenantId, Guid userId, Guid courseId, string? courseName = null)
        {
            return SendEventAsync("course_completed", clientId, new Dictionary<string, object>
            {
                { "tenant_id", tenantId.ToString() },
                { "user_id", userId.ToString() },
                { "course_id", courseId.ToString() },
                { "course_name", courseName ?? "" }
            });
        }

        /// <summary>
        /// Tracks a quiz_attempted event.
        /// </summary>
        public Task TrackQuizAttemptedAsync(
            string clientId, Guid tenantId, Guid userId, Guid assessmentId, decimal? score = null)
        {
            return SendEventAsync("quiz_attempted", clientId, new Dictionary<string, object>
            {
                { "tenant_id", tenantId.ToString() },
                { "user_id", userId.ToString() },
                { "assessment_id", assessmentId.ToString() },
                { "score", score?.ToString("F2") ?? "0" }
            });
        }

        /// <summary>
        /// Sends a single event to the GA4 Measurement Protocol endpoint.
        /// </summary>
        private async Task SendEventAsync(
            string eventName, string clientId, Dictionary<string, object> parameters)
        {
            if (string.IsNullOrWhiteSpace(_measurementId) || string.IsNullOrWhiteSpace(_apiSecret))
            {
                _logger.LogWarning("GA4: MeasurementId or ApiSecret not configured. Skipping event '{Event}'.", eventName);
                return;
            }

            var url = $"{GA4_ENDPOINT}?measurement_id={_measurementId}&api_secret={_apiSecret}";

            var payload = new
            {
                client_id = clientId,
                events = new[]
                {
                    new
                    {
                        name = eventName,
                        @params = parameters
                    }
                }
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, payload);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("GA4: Failed to send event '{Event}'. Status: {Status}, Details: {Error}",
                        eventName, response.StatusCode, error);
                }
                else
                {
                    _logger.LogInformation("GA4: Event '{Event}' sent successfully for tenant {TenantId}.",
                        eventName, parameters.GetValueOrDefault("tenant_id"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GA4: Exception sending event '{Event}'.", eventName);
            }
        }
    }
}
