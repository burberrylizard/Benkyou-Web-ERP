using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Sends events to Mixpanel's HTTP Ingestion API.
    /// Every event includes tenant_id, user_id, and timestamp as properties.
    /// Tracks: course_enrolled, course_completed, quiz_attempted.
    /// </summary>
    public class MixpanelService
    {
        private readonly HttpClient _httpClient;
        private readonly string _token;
        private readonly ILogger<MixpanelService> _logger;

        private const string MIXPANEL_TRACK_URL = "https://api.mixpanel.com/track";

        public MixpanelService(
            HttpClient httpClient,
            IConfiguration config,
            ILogger<MixpanelService> logger)
        {
            _httpClient = httpClient;
            _token = config["Mixpanel:Token"] ?? "";
            _logger = logger;
        }

        /// <summary>
        /// Tracks a course_enrolled event.
        /// </summary>
        public Task TrackCourseEnrolledAsync(
            Guid tenantId, Guid userId, Guid courseId, string? courseName = null)
        {
            return SendEventAsync("course_enrolled", tenantId, userId, new Dictionary<string, object>
            {
                { "course_id", courseId.ToString() },
                { "course_name", courseName ?? "" }
            });
        }

        /// <summary>
        /// Tracks a course_completed event.
        /// </summary>
        public Task TrackCourseCompletedAsync(
            Guid tenantId, Guid userId, Guid courseId, string? courseName = null)
        {
            return SendEventAsync("course_completed", tenantId, userId, new Dictionary<string, object>
            {
                { "course_id", courseId.ToString() },
                { "course_name", courseName ?? "" }
            });
        }

        /// <summary>
        /// Tracks a quiz_attempted event.
        /// </summary>
        public Task TrackQuizAttemptedAsync(
            Guid tenantId, Guid userId, Guid assessmentId, decimal? score = null)
        {
            return SendEventAsync("quiz_attempted", tenantId, userId, new Dictionary<string, object>
            {
                { "assessment_id", assessmentId.ToString() },
                { "score", score?.ToString("F2") ?? "0" }
            });
        }

        /// <summary>
        /// Sends a single event to Mixpanel's Track API.
        /// Uses the /track endpoint with JSON payload.
        /// </summary>
        private async Task SendEventAsync(
            string eventName, Guid tenantId, Guid userId, Dictionary<string, object> additionalProperties)
        {
            if (string.IsNullOrWhiteSpace(_token))
            {
                _logger.LogWarning("Mixpanel: Token not configured. Skipping event '{Event}'.", eventName);
                return;
            }

            var properties = new Dictionary<string, object>
            {
                { "token", _token },
                { "distinct_id", userId.ToString() },
                { "tenant_id", tenantId.ToString() },
                { "user_id", userId.ToString() },
                { "time", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() },
                { "timestamp", DateTime.UtcNow.ToString("o") }
            };

            // Merge additional properties
            foreach (var kvp in additionalProperties)
            {
                properties[kvp.Key] = kvp.Value;
            }

            var payload = new[]
            {
                new
                {
                    @event = eventName,
                    properties
                }
            };

            try
            {
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(MIXPANEL_TRACK_URL, content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Mixpanel: Failed to send event '{Event}'. Status: {Status}, Details: {Error}",
                        eventName, response.StatusCode, error);
                }
                else
                {
                    _logger.LogInformation("Mixpanel: Event '{Event}' sent for tenant {TenantId}, user {UserId}.",
                        eventName, tenantId, userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Mixpanel: Exception sending event '{Event}'.", eventName);
            }
        }
    }
}
