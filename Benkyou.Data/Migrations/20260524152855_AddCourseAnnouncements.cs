using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Benkyou.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseAnnouncements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseAnnouncements",
                columns: table => new
                {
                    CourseAnnouncementID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseID = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AllowReplies = table.Column<bool>(type: "bit", nullable: false),
                    AuthorID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAnnouncements", x => x.CourseAnnouncementID);
                    table.ForeignKey(
                        name: "FK_CourseAnnouncements_Courses_CourseID",
                        column: x => x.CourseID,
                        principalTable: "Courses",
                        principalColumn: "CourseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CourseAnnouncements_Users_AuthorID",
                        column: x => x.AuthorID,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementReplies",
                columns: table => new
                {
                    AnnouncementReplyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseAnnouncementID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementReplies", x => x.AnnouncementReplyID);
                    table.ForeignKey(
                        name: "FK_AnnouncementReplies_CourseAnnouncements_CourseAnnouncementID",
                        column: x => x.CourseAnnouncementID,
                        principalTable: "CourseAnnouncements",
                        principalColumn: "CourseAnnouncementID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementReplies_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReplies_CourseAnnouncementID",
                table: "AnnouncementReplies",
                column: "CourseAnnouncementID");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReplies_TenantID",
                table: "AnnouncementReplies",
                column: "TenantID");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementReplies_UserID",
                table: "AnnouncementReplies",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAnnouncements_AuthorID",
                table: "CourseAnnouncements",
                column: "AuthorID");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAnnouncements_CourseID",
                table: "CourseAnnouncements",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAnnouncements_TenantID",
                table: "CourseAnnouncements",
                column: "TenantID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementReplies");

            migrationBuilder.DropTable(
                name: "CourseAnnouncements");
        }
    }
}
