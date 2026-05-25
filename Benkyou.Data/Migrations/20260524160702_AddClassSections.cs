using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Benkyou.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClassSectionID",
                table: "Enrollments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClassSections",
                columns: table => new
                {
                    ClassSectionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseID = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassSections", x => x.ClassSectionID);
                    table.ForeignKey(
                        name: "FK_ClassSections_Courses_CourseID",
                        column: x => x.CourseID,
                        principalTable: "Courses",
                        principalColumn: "CourseID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_ClassSectionID",
                table: "Enrollments",
                column: "ClassSectionID");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_CourseID",
                table: "ClassSections",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_TenantID",
                table: "ClassSections",
                column: "TenantID");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_ClassSections_ClassSectionID",
                table: "Enrollments",
                column: "ClassSectionID",
                principalTable: "ClassSections",
                principalColumn: "ClassSectionID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_ClassSections_ClassSectionID",
                table: "Enrollments");

            migrationBuilder.DropTable(
                name: "ClassSections");

            migrationBuilder.DropIndex(
                name: "IX_Enrollments_ClassSectionID",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "ClassSectionID",
                table: "Enrollments");
        }
    }
}
