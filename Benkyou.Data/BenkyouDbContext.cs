using Benkyou.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.Data
{
    public class BenkyouDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public BenkyouDbContext(DbContextOptions<BenkyouDbContext> options)
            : base(options) { }

        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<EnrollmentRequest> EnrollmentRequests => Set<EnrollmentRequest>();
        public DbSet<BatchEnrollmentLog> BatchEnrollmentLogs => Set<BatchEnrollmentLog>();
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
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
        public DbSet<ContentItem> ContentItems => Set<ContentItem>();
        public DbSet<ContentProgress> ContentProgresses => Set<ContentProgress>();
        public DbSet<InstructorProfile> InstructorProfiles => Set<InstructorProfile>();
        public DbSet<TermsAcceptance> TermsAcceptances => Set<TermsAcceptance>();
        public DbSet<AssessmentResult> AssessmentResults => Set<AssessmentResult>();
        public DbSet<StudentAttempt> StudentAttempts => Set<StudentAttempt>();
        public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();
        public DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; } = null!;
        public DbSet<CourseAnnouncement> CourseAnnouncements => Set<CourseAnnouncement>();
        public DbSet<AnnouncementReply> AnnouncementReplies => Set<AnnouncementReply>();
        public DbSet<ClassSection> ClassSections => Set<ClassSection>();

        protected override void OnModelCreating(ModelBuilder mb)
        {
            base.OnModelCreating(mb); // IMPORTANT for Identity

            mb.Entity<Organization>(e =>
            {
                e.HasKey(x => x.TenantID);

                e.Property(x => x.TenantID)
                    .HasDefaultValueSql("NEWID()")
                    .ValueGeneratedOnAdd();

                e.HasIndex(x => x.TenantID).IsUnique();
                e.HasIndex(x => x.TenantCode).IsUnique();
            });

            mb.Entity<User>(e =>
            {
                e.HasIndex(x => new { x.TenantID, x.Email }).IsUnique();

                // Map database datetime2 (DateTime) to C# DateTimeOffset? to prevent InvalidCastException
                e.Property(u => u.LockoutEnd)
                    .HasConversion(
                        v => v.HasValue ? v.Value.DateTime : (DateTime?)null,
                        v => v.HasValue ? new DateTimeOffset(v.Value, TimeSpan.Zero) : (DateTimeOffset?)null
                    );
            });

            mb.Entity<TermsAcceptance>(e =>
            {
                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            mb.Entity<SubscriptionPlan>(e =>
            {
                e.HasKey(x => x.PlanID);

                e.Property(x => x.PriceMonthly)
                    .HasPrecision(7, 2);

                e.Property(x => x.PriceYearly)
                    .HasPrecision(8, 2);
            });

            mb.Entity<Assessment>()
               .Property(a => a.PassingScore)
               .HasPrecision(5, 2);

            mb.Entity<AssessmentResult>()
                .Property(r => r.Score)
                .HasPrecision(5, 2);

            mb.Entity<Question>()
                .Property(q => q.Points)
                .HasPrecision(5, 2);

            mb.Entity<CourseInstructor>()
                .HasOne(ci => ci.Instructor)
                .WithMany()
                .HasForeignKey(ci => ci.InstructorID)
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<CourseInstructor>()
                .HasOne(ci => ci.Course)
                .WithMany(c => c.Instructors)
                .HasForeignKey(ci => ci.CourseID);

            mb.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentID)
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseID);

            mb.Entity<EnrollmentRequest>(e =>
            {
                e.HasOne(er => er.Student)
                    .WithMany()
                    .HasForeignKey(er => er.StudentID)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(er => er.Course)
                    .WithMany()
                    .HasForeignKey(er => er.CourseID)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(er => er.ReviewedByUser)
                    .WithMany()
                    .HasForeignKey(er => er.ReviewedByUserID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            mb.Entity<BatchEnrollmentLog>(e =>
            {
                e.HasOne(bel => bel.Course)
                    .WithMany()
                    .HasForeignKey(bel => bel.CourseID)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(bel => bel.EnrolledByUser)
                    .WithMany()
                    .HasForeignKey(bel => bel.EnrolledByUserID)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasIndex(bel => bel.TenantID);
            });

            mb.Entity<ContentProgress>()
                .HasOne(cp => cp.Enrollment)
                .WithMany()
                .HasForeignKey(cp => cp.EnrollmentID)
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<ContentProgress>()
                .HasOne(cp => cp.Content)
                .WithMany()
                .HasForeignKey(cp => cp.ContentItemID)
                .OnDelete(DeleteBehavior.Cascade);
            
            mb.Entity<CourseSection>()
                .HasOne(s => s.Course)
                .WithMany(c => c.Sections)
                .HasForeignKey(s => s.CourseID)
                .OnDelete(DeleteBehavior.Cascade);

            mb.Entity<ContentItem>()
                .HasOne(c => c.Section)
                .WithMany(s => s.Contents)
                .HasForeignKey(c => c.CourseSectionID)
                .OnDelete(DeleteBehavior.Cascade);

            mb.Entity<Course>()
                .HasOne(c => c.Category)
                .WithMany(cat => cat.Courses)
                .HasForeignKey(c => c.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            // StudentAttempt relationships
            mb.Entity<StudentAttempt>()
                .HasOne(sa => sa.Assessment)
                .WithMany(a => a.Attempts)
                .HasForeignKey(sa => sa.AssessmentID)
                .OnDelete(DeleteBehavior.Cascade);

            mb.Entity<StudentAttempt>()
                .HasOne(sa => sa.Student)
                .WithMany()
                .HasForeignKey(sa => sa.StudentID)
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<StudentAttempt>()
                .Property(sa => sa.Score)
                .HasPrecision(5, 2);

            // StudentAnswer relationships
            mb.Entity<StudentAnswer>()
                .HasOne(a => a.Attempt)
                .WithMany(sa => sa.Answers)
                .HasForeignKey(a => a.StudentAttemptID)
                .OnDelete(DeleteBehavior.Cascade);

            mb.Entity<StudentAnswer>()
                .HasOne(a => a.Question)
                .WithMany(q => q.StudentAnswers)
                .HasForeignKey(a => a.QuestionID)
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<StudentAnswer>()
                .Property(a => a.ManualScore)
                .HasPrecision(5, 2);

            // Announcement and Reply relationships
            mb.Entity<CourseAnnouncement>(e =>
            {
                e.HasKey(x => x.CourseAnnouncementID);
                e.HasIndex(x => x.TenantID);

                e.HasOne(x => x.Course)
                    .WithMany()
                    .HasForeignKey(x => x.CourseID)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Author)
                    .WithMany()
                    .HasForeignKey(x => x.AuthorID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            mb.Entity<AnnouncementReply>(e =>
            {
                e.HasKey(x => x.AnnouncementReplyID);
                e.HasIndex(x => x.TenantID);

                e.HasOne(x => x.Announcement)
                    .WithMany(x => x.Replies)
                    .HasForeignKey(x => x.CourseAnnouncementID)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            mb.Entity<Course>()
                .HasOne(c => c.CreatedBy)
                .WithMany()
                .HasForeignKey(c => c.CreatedByUserID)
                .OnDelete(DeleteBehavior.Restrict);

            // ClassSection mappings
            mb.Entity<ClassSection>(e =>
            {
                e.HasKey(x => x.ClassSectionID);
                e.HasIndex(x => x.TenantID);

                e.HasOne(x => x.Course)
                    .WithMany()
                    .HasForeignKey(x => x.CourseID)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Instructor)
                    .WithMany()
                    .HasForeignKey(x => x.InstructorID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            mb.Entity<Enrollment>(e =>
            {
                e.HasOne(x => x.ClassSection)
                    .WithMany(s => s.Enrollments)
                    .HasForeignKey(x => x.ClassSectionID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Renaming Identity Tables for cleaner structure (Optional but recommended)
            mb.Entity<User>().ToTable("Users");
            mb.Entity<IdentityRole<Guid>>().ToTable("Roles");
            mb.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            mb.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            mb.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            mb.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
            mb.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
        }
    }
}
