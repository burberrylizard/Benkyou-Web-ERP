using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Benkyou.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveInstructorToSection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InstructorID",
                table: "ClassSections",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_InstructorID",
                table: "ClassSections",
                column: "InstructorID");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassSections_Users_InstructorID",
                table: "ClassSections",
                column: "InstructorID",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassSections_Users_InstructorID",
                table: "ClassSections");

            migrationBuilder.DropIndex(
                name: "IX_ClassSections_InstructorID",
                table: "ClassSections");

            migrationBuilder.DropColumn(
                name: "InstructorID",
                table: "ClassSections");
        }
    }
}
