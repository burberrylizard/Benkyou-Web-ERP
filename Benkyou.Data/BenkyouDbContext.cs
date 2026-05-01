using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Benkyou.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.Data
{

    public class BenkyouDbContext : DbContext
    {
        public BenkyouDbContext(DbContextOptions<BenkyouDbContext> options)
            : base(options) { }

        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<Assessment> Assessments => Set<Assessment>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<QuestionChoice> QuestionChoices => Set<QuestionChoice>();
        public DbSet<CourseInstructor> CourseInstructors => Set<CourseInstructor>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<CourseSection> CourseSections => Set<CourseSection>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
        public DbSet<SuperAdmin> SuperAdmins => Set<SuperAdmin>();
        public DbSet<Subscription>Subscriptions => Set<Subscription>();
        public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
        public DbSet<ContentItem> ContentItems => Set<ContentItem>();
        public DbSet<ContentProgress> ContentProgresses => Set<ContentProgress>();
        public DbSet<InstructorProfile> InstructorProfiles => Set<InstructorProfile>();


        protected override void OnModelCreating(ModelBuilder mb)
        {
            mb.Entity<Organization>(e =>
            {
                e.HasKey(x => x.OrganizationID);

                e.Property(x => x.TenantID)
                    .HasDefaultValueSql("NEWID()")
                    .ValueGeneratedOnAdd();

                e.HasIndex(x => x.TenantID).IsUnique();
                e.HasIndex(x => x.TenantCode).IsUnique();
            });

            mb.Entity<User>(e =>
            {
                e.HasKey(x => x.UserID);

                e.HasIndex(x => new { x.TenantID, x.Email }).IsUnique();

                e.HasOne<Organization>()
                    .WithMany(o => o.Users)
                    .HasForeignKey(x => x.TenantID)
                    .HasPrincipalKey(o => o.TenantID);
            });

            mb.Entity<SubscriptionPlan>(e =>
            {
                e.HasKey(x => x.PlanID);

                e.Property(x => x.PriceMonthly)
                    .HasPrecision(7, 2);

                e.Property(x => x.PriceYearly)
                    .HasPrecision(8, 2);
            });
        }
    }
}
