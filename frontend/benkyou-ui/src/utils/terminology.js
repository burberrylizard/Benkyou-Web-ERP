export function getTerminology(orgType) {
  const type = orgType || "HigherEducation";
  switch (type) {
    case "K12":
      return {
        program: "Grade/Track",
        yearLevel: "Grade Level",
        programPlural: "Grades & Tracks",
        yearLevelPlural: "Grade Levels",
        course: "Subject",
        coursePlural: "Subjects",
        student: "Student",
        studentPlural: "Students"
      };
    case "HigherEducation":
    default:
      return {
        program: "Program",
        yearLevel: "Year Level",
        programPlural: "Programs",
        yearLevelPlural: "Year Levels",
        course: "Course",
        coursePlural: "Courses",
        student: "Student",
        studentPlural: "Students"
      };
  }
}

export function getYearLevelsList(orgType) {
  const type = orgType || "HigherEducation";
  switch (type) {
    case "K12":
      return ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    case "HigherEducation":
    default:
      return ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  }
}
