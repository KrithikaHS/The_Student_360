# Student 360°

Student 360° is a full-stack student management and placement portal designed to help colleges streamline academics, mentorship, and placements. It uses a React frontend, Django REST Framework backend, and MySQL database for a seamless experience.

---

## Features

### Admin

* Register students and upload official documents such as marksheets and ID cards.

### Mentor

* Self-register as a mentor.
* Manage assigned students and track their progress.
* Update student records, including GPA, skills, certifications, and internships.
* Add achievements, projects, and provide feedback.

### Student

* Login with student ID.
* View personal academic records, skills, certifications, and placement status.
* Check eligibility for upcoming company drives.

### Placement Officer

* Add companies and define job criteria.
* Schedule and announce placement drives.
* Generate eligible student lists automatically.
* Update placement results and generate analytics.

---

## Tech Stack

* Frontend: React.js
* Backend: Django REST Framework
* Database: MySQL
* Version Control: Git & GitHub

---

## Project Structure

```
360/
│── backend/        # Django backend (APIs, models, authentication)
│── frontend/       # React frontend (UI dashboards)
│── docs/           # ER diagrams and design documents
│── README.md       # Project overview
```

---

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/your-username/the_student_360.git
```

### Setup Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

## Future Plans

* Role-based analytics dashboards with AI-driven insights.
* Cloud deployment capable of handling 10,000+ students efficiently.

---

## Contributors

@KrithikaHS
@Pallavi-Patil6
