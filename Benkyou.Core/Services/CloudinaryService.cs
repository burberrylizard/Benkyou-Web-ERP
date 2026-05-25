using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Benkyou.Core.Services
{
    public class CloudinaryService(Cloudinary cloudinary, ILogger<CloudinaryService> logger)
    {
        private readonly Cloudinary _cloudinary = cloudinary ?? throw new ArgumentNullException(nameof(cloudinary));
        private readonly ILogger<CloudinaryService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        /// <summary>
        /// Uploads a user's profile photo to Cloudinary after validating the extension and size.
        /// </summary>
        public async Task<(bool Succeeded, string? SecureUrl, string? PublicId, string? ErrorMessage)> UploadProfilePhotoAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
            {
                return (false, null, null, "No file was provided or the file is empty.");
            }

            // 1. Validate File Size (Maximum 5MB)
            const long maxFileSize = 5 * 1024 * 1024; // 5MB
            if (file.Length > maxFileSize)
            {
                return (false, null, null, "File size exceeds the maximum limit of 5MB.");
            }

            // 2. Validate Extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".webp")
            {
                return (false, null, null, "Invalid file format. Only .jpg, .jpeg, .png, and .webp are allowed.");
            }

            try
            {
                _logger.LogInformation("Uploading profile photo for user {UserId} to Cloudinary...", userId);

                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "profile-photos",
                    // Use a unique public ID under the folder to avoid collision, or we can let Cloudinary generate it
                    PublicId = $"user_{userId}_{Guid.NewGuid()}",
                    Transformation = new Transformation().Width(500).Height(500).Crop("fill").Gravity("face") // Premium optimization!
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    _logger.LogError("Cloudinary upload failed: {Message}", uploadResult.Error.Message);
                    return (false, null, null, $"Cloudinary upload failed: {uploadResult.Error.Message}");
                }

                _logger.LogInformation("Profile photo successfully uploaded for user {UserId}. PublicId: {PublicId}", userId, uploadResult.PublicId);
                return (true, uploadResult.SecureUrl.ToString(), uploadResult.PublicId, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during Cloudinary upload for user {UserId}", userId);
                return (false, null, null, $"An unexpected error occurred during photo upload: {ex.Message}");
            }
        }

        /// <summary>
        /// Deletes a photo from Cloudinary using its public_id.
        /// </summary>
        public async Task<(bool Succeeded, string? ErrorMessage)> DeleteProfilePhotoAsync(string publicId)
        {
            if (string.IsNullOrWhiteSpace(publicId))
            {
                return (true, null); // Nothing to delete
            }

            try
            {
                _logger.LogInformation("Deleting photo with PublicId: {PublicId} from Cloudinary...", publicId);

                var deletionParams = new DeletionParams(publicId);
                var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

                if (deletionResult.Result != "ok" && deletionResult.Result != "not found")
                {
                    _logger.LogError("Failed to delete photo from Cloudinary. Result: {Result}", deletionResult.Result);
                    return (false, $"Cloudinary deletion failed: {deletionResult.Result}");
                }

                _logger.LogInformation("Photo with PublicId {PublicId} deleted successfully from Cloudinary.", publicId);
                return (true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while deleting photo {PublicId} from Cloudinary", publicId);
                return (false, $"An unexpected error occurred during photo deletion: {ex.Message}");
            }
        }

        /// <summary>
        /// Uploads course files (.pdf, .ppt, .pptx, .docx) to Cloudinary raw storage.
        /// </summary>
        public async Task<(bool Succeeded, string? SecureUrl, string? PublicId, string? ErrorMessage)> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return (false, null, null, "No file was provided or the file is empty.");
            }

            // 1. Validate File Size (Maximum 15MB)
            const long maxFileSize = 15 * 1024 * 1024; // 15MB
            if (file.Length > maxFileSize)
            {
                return (false, null, null, "File size exceeds the maximum limit of 15MB.");
            }

            // 2. Validate Extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".pdf" && extension != ".ppt" && extension != ".pptx" && extension != ".docx")
            {
                return (false, null, null, "Invalid file format. Only .pdf, .ppt, .pptx, and .docx are allowed.");
            }

            try
            {
                _logger.LogInformation("Uploading course file {FileName} to Cloudinary...", file.FileName);

                using var stream = file.OpenReadStream();

                if (extension == ".pdf")
                {
                    // PDFs are uploaded as image resources to enable inline browser viewing with correct MIME type
                    var uploadParams = new ImageUploadParams
                    {
                        File = new FileDescription(file.FileName, stream),
                        Folder = "course-contents",
                        PublicId = $"file_{Guid.NewGuid()}"
                    };

                    var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                    if (uploadResult.Error != null)
                    {
                        _logger.LogError("Cloudinary PDF upload failed: {Message}", uploadResult.Error.Message);
                        return (false, null, null, $"Cloudinary upload failed: {uploadResult.Error.Message}");
                    }

                    return (true, uploadResult.SecureUrl.ToString(), uploadResult.PublicId, null);
                }
                else
                {
                    // PPT, PPTX, DOCX are uploaded as raw resources (triggering a download)
                    var uploadParams = new RawUploadParams
                    {
                        File = new FileDescription(file.FileName, stream),
                        Folder = "course-contents",
                        PublicId = $"file_{Guid.NewGuid()}{extension}"
                    };

                    var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                    if (uploadResult.Error != null)
                    {
                        _logger.LogError("Cloudinary raw file upload failed: {Message}", uploadResult.Error.Message);
                        return (false, null, null, $"Cloudinary upload failed: {uploadResult.Error.Message}");
                    }

                    return (true, uploadResult.SecureUrl.ToString(), uploadResult.PublicId, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during Cloudinary upload for course file.");
                return (false, null, null, $"An unexpected error occurred during file upload: {ex.Message}");
            }
        }
    }
}
