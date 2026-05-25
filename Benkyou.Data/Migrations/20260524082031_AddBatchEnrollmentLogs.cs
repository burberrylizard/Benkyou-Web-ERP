using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Benkyou.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBatchEnrollmentLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BatchEnrollmentLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseID = table.Column<int>(type: "int", nullable: false),
                    EnrolledByUserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FilterProgram = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FilterYearLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StudentsEnrolled = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BatchEnrollmentLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BatchEnrollmentLogs_Courses_CourseID",
                        column: x => x.CourseID,
                        principalTable: "Courses",
                        principalColumn: "CourseID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BatchEnrollmentLogs_Users_EnrolledByUserID",
                        column: x => x.EnrolledByUserID,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BatchEnrollmentLogs_CourseID",
                table: "BatchEnrollmentLogs",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_BatchEnrollmentLogs_EnrolledByUserID",
                table: "BatchEnrollmentLogs",
                column: "EnrolledByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_BatchEnrollmentLogs_TenantID",
                table: "BatchEnrollmentLogs",
                column: "TenantID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BatchEnrollmentLogs");
        }
    }
}
