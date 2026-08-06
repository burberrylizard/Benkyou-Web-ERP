using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Benkyou.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintsAll : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cleanup duplicate categories (keep the lowest CategoryID, update Courses, delete other categories)
            migrationBuilder.Sql(@"
                WITH CatDuplicates AS (
                    SELECT CategoryID, TenantID, Name,
                           ROW_NUMBER() OVER (PARTITION BY TenantID, Name ORDER BY CategoryID) as RowNum,
                           FIRST_VALUE(CategoryID) OVER (PARTITION BY TenantID, Name ORDER BY CategoryID) as KeepID
                    FROM Categories
                )
                UPDATE c
                SET c.CategoryID = cd.KeepID
                FROM Courses c
                JOIN CatDuplicates cd ON c.CategoryID = cd.CategoryID
                WHERE cd.RowNum > 1;

                WITH CatDuplicates AS (
                    SELECT CategoryID,
                           ROW_NUMBER() OVER (PARTITION BY TenantID, Name ORDER BY CategoryID) as RowNum
                    FROM Categories
                )
                DELETE FROM Categories WHERE CategoryID IN (SELECT CategoryID FROM CatDuplicates WHERE RowNum > 1);
            ");

            // Rename duplicate courses
            migrationBuilder.Sql(@"
                WITH CourseDuplicates AS (
                    SELECT CourseID,
                           ROW_NUMBER() OVER (PARTITION BY TenantID, Title ORDER BY CourseID) as RowNum
                    FROM Courses
                )
                UPDATE c
                SET c.Title = c.Title + ' (Duplicate ' + CAST(cd.RowNum - 1 AS VARCHAR) + ')'
                FROM Courses c
                JOIN CourseDuplicates cd ON c.CourseID = cd.CourseID
                WHERE cd.RowNum > 1;
            ");

            // Rename duplicate assessments
            migrationBuilder.Sql(@"
                WITH AssessmentDuplicates AS (
                    SELECT AssessmentID,
                           ROW_NUMBER() OVER (PARTITION BY CourseID, Title ORDER BY AssessmentID) as RowNum
                    FROM Assessments
                )
                UPDATE a
                SET a.Title = a.Title + ' (Duplicate ' + CAST(ad.RowNum - 1 AS VARCHAR) + ')'
                FROM Assessments a
                JOIN AssessmentDuplicates ad ON a.AssessmentID = ad.AssessmentID
                WHERE ad.RowNum > 1;
            ");

            // Rename duplicate class sections
            migrationBuilder.Sql(@"
                WITH ClassSectionDuplicates AS (
                    SELECT ClassSectionID,
                           ROW_NUMBER() OVER (PARTITION BY CourseID, Name ORDER BY ClassSectionID) as RowNum
                    FROM ClassSections
                )
                UPDATE cs
                SET cs.Name = cs.Name + ' (Duplicate ' + CAST(csd.RowNum - 1 AS VARCHAR) + ')'
                FROM ClassSections cs
                JOIN ClassSectionDuplicates csd ON cs.ClassSectionID = csd.ClassSectionID
                WHERE csd.RowNum > 1;
            ");

            // Rename duplicate course sections
            migrationBuilder.Sql(@"
                WITH CourseSectionDuplicates AS (
                    SELECT CourseSectionID,
                           ROW_NUMBER() OVER (PARTITION BY CourseID, Title ORDER BY CourseSectionID) as RowNum
                    FROM CourseSections
                )
                UPDATE cs
                SET cs.Title = cs.Title + ' (Duplicate ' + CAST(csd.RowNum - 1 AS VARCHAR) + ')'
                FROM CourseSections cs
                JOIN CourseSectionDuplicates csd ON cs.CourseSectionID = csd.CourseSectionID
                WHERE csd.RowNum > 1;
            ");

            // Rename duplicate content items
            migrationBuilder.Sql(@"
                WITH ContentItemDuplicates AS (
                    SELECT ContentItemID,
                           ROW_NUMBER() OVER (PARTITION BY CourseSectionID, Title ORDER BY ContentItemID) as RowNum
                    FROM ContentItems
                )
                UPDATE ci
                SET ci.Title = ci.Title + ' (Duplicate ' + CAST(cid.RowNum - 1 AS VARCHAR) + ')'
                FROM ContentItems ci
                JOIN ContentItemDuplicates cid ON ci.ContentItemID = cid.ContentItemID
                WHERE cid.RowNum > 1;
            ");

            // Rename duplicate organizations
            migrationBuilder.Sql(@"
                WITH OrgDuplicates AS (
                    SELECT TenantID,
                           ROW_NUMBER() OVER (PARTITION BY Name ORDER BY TenantID) as RowNum
                    FROM Organizations
                )
                UPDATE o
                SET o.Name = o.Name + ' (Duplicate ' + CAST(od.RowNum - 1 AS VARCHAR) + ')'
                FROM Organizations o
                JOIN OrgDuplicates od ON o.TenantID = od.TenantID
                WHERE od.RowNum > 1;
            ");

            // Rename duplicate subscription plans
            migrationBuilder.Sql(@"
                WITH PlanDuplicates AS (
                    SELECT PlanID,
                           ROW_NUMBER() OVER (PARTITION BY Name ORDER BY PlanID) as RowNum
                    FROM SubscriptionPlans
                )
                UPDATE sp
                SET sp.Name = sp.Name + ' (Duplicate ' + CAST(pd.RowNum - 1 AS VARCHAR) + ')'
                FROM SubscriptionPlans sp
                JOIN PlanDuplicates pd ON sp.PlanID = pd.PlanID
                WHERE pd.RowNum > 1;
            ");
            migrationBuilder.Sql(@"
                WITH PlanDuplicates AS (
                    SELECT PlanID,
                           ROW_NUMBER() OVER (PARTITION BY PlanCode ORDER BY PlanID) as RowNum
                    FROM SubscriptionPlans
                )
                UPDATE sp
                SET sp.PlanCode = sp.PlanCode + ' (Duplicate ' + CAST(pd.RowNum - 1 AS VARCHAR) + ')'
                FROM SubscriptionPlans sp
                JOIN PlanDuplicates pd ON sp.PlanID = pd.PlanID
                WHERE pd.RowNum > 1;
            ");

            migrationBuilder.DropIndex(
                name: "IX_CourseSections_CourseID",
                table: "CourseSections");

            migrationBuilder.DropIndex(
                name: "IX_ContentItems_CourseSectionID",
                table: "ContentItems");

            migrationBuilder.DropIndex(
                name: "IX_ClassSections_CourseID",
                table: "ClassSections");

            migrationBuilder.DropIndex(
                name: "IX_Assessments_CourseID",
                table: "Assessments");

            migrationBuilder.AlterColumn<string>(
                name: "PlanCode",
                table: "SubscriptionPlans",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "SubscriptionPlans",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Organizations",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "CourseSections",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Courses",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ContentItems",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ClassSections",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Assessments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_Name",
                table: "SubscriptionPlans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_PlanCode",
                table: "SubscriptionPlans",
                column: "PlanCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Name",
                table: "Organizations",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseSections_CourseID_Title",
                table: "CourseSections",
                columns: new[] { "CourseID", "Title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Courses_TenantID_Title",
                table: "Courses",
                columns: new[] { "TenantID", "Title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentItems_CourseSectionID_Title",
                table: "ContentItems",
                columns: new[] { "CourseSectionID", "Title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_CourseID_Name",
                table: "ClassSections",
                columns: new[] { "CourseID", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_TenantID_Name",
                table: "Categories",
                columns: new[] { "TenantID", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_CourseID_Title",
                table: "Assessments",
                columns: new[] { "CourseID", "Title" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SubscriptionPlans_Name",
                table: "SubscriptionPlans");

            migrationBuilder.DropIndex(
                name: "IX_SubscriptionPlans_PlanCode",
                table: "SubscriptionPlans");

            migrationBuilder.DropIndex(
                name: "IX_Organizations_Name",
                table: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_CourseSections_CourseID_Title",
                table: "CourseSections");

            migrationBuilder.DropIndex(
                name: "IX_Courses_TenantID_Title",
                table: "Courses");

            migrationBuilder.DropIndex(
                name: "IX_ContentItems_CourseSectionID_Title",
                table: "ContentItems");

            migrationBuilder.DropIndex(
                name: "IX_ClassSections_CourseID_Name",
                table: "ClassSections");

            migrationBuilder.DropIndex(
                name: "IX_Categories_TenantID_Name",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Assessments_CourseID_Title",
                table: "Assessments");

            migrationBuilder.AlterColumn<string>(
                name: "PlanCode",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "SubscriptionPlans",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Organizations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "CourseSections",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ContentItems",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ClassSections",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Assessments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_CourseSections_CourseID",
                table: "CourseSections",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_ContentItems_CourseSectionID",
                table: "ContentItems",
                column: "CourseSectionID");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_CourseID",
                table: "ClassSections",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_CourseID",
                table: "Assessments",
                column: "CourseID");
        }
    }
}
