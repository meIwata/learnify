# Learnify - Marking Criteria

## Overview
This document outlines the marking criteria for the Learnify gamified learning system. Students can earn marks by completing various exercises and activities throughout the course.

## Assessment Components

### Total Marks: 50

---

## Exercise Breakdown

### 1. Check-in (10 marks)
**Objective**: Regular engagement and attendance tracking
- **Description**: Students must perform daily check-ins using the Learnify system
- **Assessment Method**: Automated tracking via API endpoints
- **Marking Criteria**:
  - Successful check-in registration: 2 marks per check-in
  - Consistent engagement (minimum 5 check-ins): Full marks
  - Sporadic engagement (3-4 check-ins): Partial marks (6-8 marks)
  - Minimal engagement (1-2 check-ins): Limited marks (2-4 marks)
- **Technical Requirements**:
  - Use POST `/api/auto/check-in` endpoint
  - Student ID and name auto-registration
  - Timestamp recording for each check-in

### 2. Submit App Review (10 marks)
**Objective**: Critical thinking and reflection on mobile applications
- **Description**: Students submit written reviews/reflections on mobile applications they use
- **Assessment Method**: Manual review of submission quality and depth
- **Marking Criteria**:
  - **Content Quality (6 marks)**:
    - Insightful analysis of app features and usability: 2 marks
    - Personal reflection on app impact: 2 marks
    - Critical evaluation of pros/cons: 2 marks
  - **Technical Submission (4 marks)**:
    - Successful API submission: 2 marks
    - Proper formatting and completeness: 2 marks
- **Technical Requirements**:
  - Use POST `/api/reflections` endpoint
  - Minimum 100 words per review
  - Include app name and detailed reflection text

### 3. Submit Profile Picture (10 marks)
**Objective**: Personal branding and system interaction
- **Description**: Students upload and manage their profile pictures
- **Assessment Method**: Successful upload and display verification
- **Marking Criteria**:
  - **Upload Success (6 marks)**:
    - Successful file upload: 3 marks
    - Proper image format and size: 3 marks
  - **Profile Integration (4 marks)**:
    - Picture displays correctly in system: 2 marks
    - Meets quality standards (appropriate, professional): 2 marks
- **Technical Requirements**:
  - Use Supabase Storage API
  - Supported formats: JPG, PNG, GIF
  - Maximum file size: 5MB
  - Minimum resolution: 200x200 pixels

### 4. Submit GitHub Repository (10 marks)
**Objective**: Code sharing and version control practice
- **Description**: Students create and submit their personal GitHub repositories
- **Assessment Method**: Repository inspection and validation
- **Marking Criteria**:
  - **Repository Setup (5 marks)**:
    - Repository created and accessible: 2 marks
    - Proper README.md file: 2 marks
    - Appropriate repository structure: 1 mark
  - **Code Quality (5 marks)**:
    - Working code with proper commits: 3 marks
    - Documentation and comments: 2 marks
- **Technical Requirements**:
  - Repository must be public or accessible to instructors
  - Include meaningful commit messages
  - Repository should contain actual project work

### 5. List Repositories under GitHub Organization (10 marks)
**Objective**: Collaboration and organizational workflow
- **Description**: Students join class GitHub organization and contribute to shared repositories
- **Assessment Method**: API verification of organization membership and contributions
- **Marking Criteria**:
  - **Organization Membership (4 marks)**:
    - Successfully joined organization: 2 marks
    - Profile visible in organization: 2 marks
  - **Repository Interaction (6 marks)**:
    - Can list organization repositories: 2 marks
    - Contributed to at least one shared repository: 2 marks
    - Meaningful contributions (commits, issues, PRs): 2 marks
- **Technical Requirements**:
  - Use GitHub API to fetch organization repositories
  - Must be active member of class organization
  - Demonstrate API integration skills

---

## Submission Guidelines

### Technical Requirements
- All submissions must go through the Learnify system
- Use proper API endpoints as specified
- Ensure data validation and error handling
- Follow the established authentication/identification patterns

### Quality Standards
- All text submissions must be in English
- Professional and appropriate content only
- Original work required (no plagiarism)
- Meet minimum length/quality requirements as specified

### Deadlines
- Check-ins: Ongoing throughout the course
- App Reviews: Due by end of week 4
- Profile Pictures: Due by end of week 2
- GitHub Repository: Due by end of week 6
- GitHub Organization: Due by end of week 8

---

## API Endpoints Reference

### Check-in
```
POST /api/auto/check-in
Body: {
  "student_id": "STUDENT2025",
  "full_name": "Student Name"
}
```

### App Review Submission
```
POST /api/reflections
Body: {
  "student_id": "STUDENT2025",
  "mobile_app_name": "Instagram",
  "reflection_text": "Detailed review content..."
}
```

### Profile Picture Upload
```
POST /api/upload/profile-picture
Content-Type: multipart/form-data
Body: {
  "student_id": "STUDENT2025",
  "profile_picture": [file]
}
```

### GitHub Repository Submission
```
POST /api/submissions/github
Body: {
  "student_id": "STUDENT2025",
  "github_username": "username",
  "repository_url": "https://github.com/username/repo"
}
```

### GitHub Organization Repositories
```
GET /api/github/org-repos/:student_id
```

---

## Grading Scale

| Percentage | Grade | Description |
|------------|-------|-------------|
| 90-100% | A | Excellent work, exceeds expectations |
| 80-89% | B | Good work, meets all requirements |
| 70-79% | C | Satisfactory work, meets most requirements |
| 60-69% | D | Below average, meets minimum requirements |
| Below 60% | F | Unsatisfactory, does not meet requirements |

---

## Support and Resources

### Technical Support
- API documentation available in `API_DESIGN.md`
- Local development setup in `LOCAL_DEVELOPMENT.md`
- System architecture in `CLAUDE.md`

### Academic Support
- Office hours: TBD
- Discussion forum: TBD
- Email support: TBD

### Important Notes
- Late submissions may receive reduced marks
- Technical issues should be reported immediately
- All work must be original and properly attributed
- Academic integrity policies apply to all submissions

---

*Last updated: 2025-07-11*
*Version: 1.0*