using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace Benkyou.Core.Services
{
    public class AccountLockoutService
    {
        private readonly BenkyouDbContext _db;

        public AccountLockoutService(BenkyouDbContext db)
        {
            _db = db;
        }

        public async Task RecordFailedAttemptAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return;

            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.IsLockedOut = true;
                user.LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(30);
            }

            await _db.SaveChangesAsync();
        }

        public async Task ResetFailedAttemptsAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return;

            user.FailedLoginAttempts = 0;
            user.IsLockedOut = false;
            user.LockoutEnd = null;

            await _db.SaveChangesAsync();
        }

        public async Task<bool> IsLockedOutAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return false;

            if (user.IsLockedOut)
            {
                if (user.LockoutEnd.HasValue && user.LockoutEnd.Value.DateTime > DateTime.UtcNow)
                {
                    return true;
                }

                // Lockout time has expired, unlock automatically
                user.FailedLoginAttempts = 0;
                user.IsLockedOut = false;
                user.LockoutEnd = null;
                await _db.SaveChangesAsync();
            }

            return false;
        }

        public async Task<int> GetLockoutTimeRemainingAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null || !user.LockoutEnd.HasValue) return 0;

            var remaining = (user.LockoutEnd.Value.DateTime - DateTime.UtcNow).TotalMinutes;
            return remaining > 0 ? (int)Math.Ceiling(remaining) : 0;
        }
    }
}
