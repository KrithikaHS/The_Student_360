from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
import os


# ------------------ Custom User Model ------------------

class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("student", "Student"),
        ("mentor", "Mentor"),
        ("placement", "Placement Cell"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]   # Django still requires username

    def __str__(self):
        return f"{self.email} ({self.role})"


# ------------------ Student Profile ------------------

class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile")

    phone = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    semester = models.IntegerField(blank=True, null=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)  # New field
    def __str__(self):
        return self.user.email


# ------------------ Mentor Profile ------------------

class MentorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentor_profile")
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.user.email


# ------------------ Placement Profile ------------------

class PlacementProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="placement_profile")
    office_code = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.user.email


# ------------------ Student Document Model ------------------

def student_document_path(instance, filename):
    return f"students_docs/{instance.student.id}/{filename}"


class StudentDocument(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="documents")

    document_type = models.CharField(max_length=50, choices=[
        ("10th_marksheet", "10th Marksheet"),
        ("12th_marksheet", "12th Marksheet"),
        ("Semester_results", "Semester results"),
        ("internship_certificate", "Internship Certificate"),
        ("nptel_certificate", "NPTEL Certificate"),
        ("course_certificate", "Course Certificate"),
        ("skill_certificate", "Skill Certificate"),
        ("other", "Other"),
    ])

    document = models.FileField(upload_to=student_document_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    status = models.CharField(max_length=20, default="pending")

    metadata = models.JSONField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)  # <-- NEW FIELD

    class Meta:
        indexes = [
            models.Index(fields=["student", "document_type"]),
        ]

    def __str__(self):
        return f"{self.student.user.email} - {self.document_type}"

    def delete(self, *args, **kwargs):
        if self.document and os.path.isfile(self.document.path):
            os.remove(self.document.path)
        super().delete(*args, **kwargs)


# ADMIN
from django.db import models
import hashlib

class AdmissionStudent(models.Model):
    name = models.CharField(max_length=255)
    dob = models.DateField()
    marks10 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    marks12 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    marks10_file = models.FileField(upload_to='marks_cards/10th/', null=True, blank=True)
    marks12_file = models.FileField(upload_to='marks_cards/12th/', null=True, blank=True)
    
    file10_hash = models.CharField(max_length=64, null=True, blank=True)
    file12_hash = models.CharField(max_length=64, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("name", "dob")  # Prevent duplicate names + dob

    def save(self, *args, **kwargs):
        # Calculate file hash if file uploaded
        if self.marks10_file:
            self.file10_hash = hashlib.sha256(self.marks10_file.read()).hexdigest()
            self.marks10_file.seek(0)  # Reset file pointer
        if self.marks12_file:
            self.file12_hash = hashlib.sha256(self.marks12_file.read()).hexdigest()
            self.marks12_file.seek(0)
        super().save(*args, **kwargs)

from django.db import models

class Students_data(models.Model):
    student = models.ForeignKey(
        'Student',
        on_delete=models.CASCADE,  # or SET_NULL if you want to allow deletion of student without deleting data
        null=True,
        blank=True,
        related_name='student_records'
    )
    name = models.CharField(max_length=200)
    branch = models.CharField(max_length=200, default="Unknown")

    dob = models.DateField()

    batch_year = models.CharField(max_length=20, db_index=True)

    percentage10 = models.FloatField(null=True, blank=True)
    percentage12 = models.FloatField(null=True, blank=True)
    assigned_mentor = models.ForeignKey(
        'Mentors_data',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_students'
    )
    # blocked = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    product = models.JSONField(default=list, blank=True)   # list of offers [{company, ctc}]
    service = models.JSONField(default=list, blank=True)
    dream = models.JSONField(default=list, blank=True)

    offer_count = models.IntegerField(default=0)   # total offers across all categories
    
    class Meta:
        unique_together = ('name', 'dob')  # Composite key
        indexes = [
            models.Index(fields=['batch_year']),
        ]

    def __str__(self):
        return f"{self.name} - {self.batch_year}"

from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid

class Mentors_data(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    max_students = models.IntegerField(default=0)
    current_student_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    
    class Meta:
        indexes = [
            models.Index(fields=['department']),
        ]

    

    def __str__(self):
        return f"{self.name} - {self.department or 'No Dept'}"

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

# added by google (Python)
class CompanyData(models.Model):
    company_name = models.CharField(max_length=255)
    eligible_batches = models.JSONField(default=list)  # List of years e.g. [2024, 2025]
    eligible_branches = models.JSONField(default=list) # List of strings
    min_cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    min_10th = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    min_12th = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    jd_file = models.FileField(upload_to='company_jds/', null=True, blank=True)
    jd_text = models.TextField(null=True, blank=True)
    additional_info = models.TextField(null=True, blank=True)
    
    registration_deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

# added by google (Python)
class CompanyApplication(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='applications')
    company = models.ForeignKey(CompanyData, on_delete=models.CASCADE, related_name='applications')
    applied = models.BooleanField(default=False)
    
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('student', 'company')
    
    def __str__(self):
        return f"{self.student} - {self.company.company_name}"
