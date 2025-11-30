from datetime import timezone
from math import ceil
import tempfile
import uuid
from django.conf import settings
from django.http import JsonResponse
from  django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .serializers import  BulkPlacementUploadSerializer, Student_dataSerializer, StudentSerializer, StudentSignupSerializer, SimpleUserSerializer, StudentDocumentSerializer
from .models import Mentors_data, StudentDocument, Student, Students_data, User
import pandas as pd
from django.views.decorators.csrf import csrf_exempt

@api_view(["POST"])
@permission_classes([AllowAny])
def signup_student(request):
    serializer = StudentSignupSerializer(data=request.data)
    print("Received:", request.data)

    if serializer.is_valid():
        name = serializer.validated_data.get("full_name")
        dob = serializer.validated_data.get("dob")  # ✅ This now works
        print("Checking:", name, dob)

        try:
            student_record = Students_data.objects.get(name=name, dob=dob)
        except Students_data.DoesNotExist:
            return Response(
                {"error": "No student record found with this name and date of birth. Signup not allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Safe to create user
        student_instance = serializer.save()
        student_record.student = student_instance
        student_record.save()
        print(f"Linked Students_data id {student_record.id} with Student id {student_instance.id}")

        return Response({
            "message": "Student account created successfully",
            "user": SimpleUserSerializer(student_instance.user).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_with_role(request):
    email = request.data.get("email")
    password = request.data.get("password")
    role = request.data.get("role")

    if not email or not password or not role:
        return Response({"error": "email, password and role required"}, status=400)

    # authenticate expects username by default; we used username=email when creating users
    user = authenticate(username=email, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    if user.role != role:
        return Response({"error": "Role mismatch"}, status=401)

    refresh = RefreshToken.for_user(user)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": SimpleUserSerializer(user).data,
        "role": user.role
    })


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_document(request):
    print("FILES RECEIVED:", request.FILES)
    print("DATA RECEIVED:", request.data)

    try:
        student = Student.objects.get(user=request.user)  # Get the Student object linked to logged-in User
    except Student.DoesNotExist:
        return Response({"error": "No student profile found"}, status=status.HTTP_400_BAD_REQUEST)

    # Inject student into request data
    # data = request.data.copy()
    # data["student"] = student.id  # Ensure the serializer gets the correct PK

    standard_fields = {"student", "document_type", "document", "status"}
    document_type = request.data.get("document_type")
    if not document_type:
        return Response({"error": "Document type is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    metadata_fields_by_type = {
        "10th_marksheet": ["percentage10"],
        "12th_marksheet": ["percentage12"],
        "Semester_results": ["sgpa"],
        "internship_certificate": ["domain", "start_date", "end_date"],
        "nptel_certificate": ["course_title", "weeks"],
        "course_certificate": ["course_name"],
        "skill_certificate": ["skill_name"],
        "other": ["title"]
    }

    allowed_fields = metadata_fields_by_type.get(document_type, [])

    metadata = {}
    for key in allowed_fields:
        value = request.data.get(key)
        if value is not None:
            # Convert numeric strings to numbers if possible
            try:
                if isinstance(value, str) and '.' in value:
                    value = float(value)
                elif isinstance(value, str):
                    value = int(value)
            except:
                pass
            metadata[key] = value
    # data["metadata"] = metadata


    serializer_data = {
            "student": student.id,
            "document_type": request.data.get("document_type"),
            "document": request.FILES.get("document"),
            "metadata": metadata
        }
    serializer = StudentDocumentSerializer(data=serializer_data)
    if serializer.is_valid():
        saved_obj=serializer.save()

        return Response({"message": "Document uploaded successfully", "data": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_documents(request, student_id=None):
    """
    List all documents for a student.
    - Students can only see their own documents.
    - Admins can see any student's documents.
    """
    # Get student_id from the logged-in student if role is "student"
    if request.user.role == "student":
        if not hasattr(request.user, "student_profile"):
            return Response({"error": "Profile not found"}, status=403)
        student_id = request.user.student_profile.id

    # student_id must exist
    if not student_id:
        return Response({"error": "Student ID required"}, status=400)

    docs = StudentDocument.objects.filter(student_id=student_id)
    serializer = StudentDocumentSerializer(docs, many=True, context={'request': request})
    print(serializer.data)
    return Response(serializer.data)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_document(request, pk):
    try:
        doc = StudentDocument.objects.get(pk=pk)
        # Only allow students to delete their own docs
        if request.user.role == "student" and (not doc.student or doc.student.user != request.user):
            return Response({"error": "Unauthorized"}, status=403)

        doc.delete()
        return Response({"message": "Deleted successfully"}, status=200)
    except StudentDocument.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Returns the current logged-in user's info.
    """
    user = request.user
    return Response({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "student_id": getattr(user.student_profile, "id", None),
    })


# ---------------- Get student by ID ----------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student(request, student_id):
    """
    Fetch student profile by ID.
    Only allow students to access their own profile; others can access any.
    """
    student = get_object_or_404(Student, id=student_id)

    # If user is a student, restrict access
    if request.user.role == "student" and student.user != request.user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    
    student_record = Students_data.objects.filter(student=student).first()
    mentor_name = None
    if student_record and student_record.assigned_mentor:
        mentor = student_record.assigned_mentor
        mentor_name = f"{mentor.name} ".strip()
    
    student_data = {
        "id": student.id,
        # "user_id": student.user.id,
        "email": student.user.email,
        "first_name": student.user.first_name,
        "last_name": student.user.last_name,
        "phone": student.phone,
        "branch": student.branch,
        "semester": student.semester,
        "cgpa": student.cgpa,
        "assigned_mentor_name": mentor_name,
        # "assigned_mentor_id": mentor.id if mentor else None,      # mentor ID
        # "assigned_mentor_name" : mentor.user.first_name if mentor else None,
        }
    
    return Response(student_data)


# ---------------- Get student by email ----------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_by_email(request):
    """
    Example: /students/?email=test@example.com
    """
    email = request.query_params.get("email")
    if not email:
        return Response({"error": "Email parameter required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
        student = getattr(user, "student_profile", None)
        if not student:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
        student_data = {
            "id": student.id,
            "email": student.user.email,
            "first_name": student.user.first_name,
            "last_name": student.user.last_name,
            "phone": student.phone,
            "branch": student.branch,
            "semester": student.semester,
            "cgpa": student.cgpa,
            "assigned_mentor_name": getattr(student.user.mentor_profile.user, "first_name", None) if hasattr(student.user, "mentor_profile") else None,
        }
        return Response(student_data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

# added by google (Python) - Get student by user ID
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_by_user_id(request, user_id):
    """
    Get student data by user ID (from localStorage)
    Example: /students/user/<user_id>/
    """
    try:
        user = User.objects.get(id=user_id)
        student = getattr(user, "student_profile", None)
        if not student:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get placement data from Students_data
        student_record = Students_data.objects.filter(student=student).first()
        
        student_data = {
            "id": student.id,
            "email": student.user.email,
            "first_name": student.user.first_name,
            "last_name": student.user.last_name,
            "phone": student.phone,
            "branch": student.branch,
            "semester": student.semester,
            "cgpa": student.cgpa,
            "assigned_mentor_name": getattr(student.user.mentor_profile.user, "first_name", None) if hasattr(student.user, "mentor_profile") else None,
            # Placement data from Students_data model
            "product": student_record.product if student_record else [],
            "service": student_record.service if student_record else [],
            "dream": student_record.dream if student_record else [],
            "offer_count": student_record.offer_count if student_record else 0,
        }
        return Response(student_data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


# ---------------- Update student profile ----------------
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_student_profile(request, student_id):
    """
    Update student profile. Students can update their own info.
    """
    student = get_object_or_404(Student, id=student_id)

    # Restrict student role to only update their own profile
    if request.user.role == "student" and student.user != request.user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data

    # Update allowed fields
    for field in ["phone", "branch", "semester", "cgpa"]:
        if field in data:
            setattr(student, field, data[field])
    student.save()

    # Safely get assigned mentor name
    assigned_mentor_name = None
    if hasattr(student.user, "mentor_profile") and student.user.mentor_profile:
        assigned_mentor_name = getattr(student.user.mentor_profile.user, "first_name", None)

    return Response({
        "message": "Profile updated successfully",
        "student": {
            "id": student.id,
            "email": student.user.email,
            "first_name": student.user.first_name,
            "last_name": student.user.last_name,
            "phone": student.phone,
            "branch": student.branch,
            "semester": student.semester,
            "cgpa": student.cgpa,
            "assigned_mentor_name": assigned_mentor_name
        }
    })

# ADMIN
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import AdmissionStudent
from .serializers import AdmissionStudentSerializer

class AdmissionStudentViewSet(viewsets.ModelViewSet):
    queryset = AdmissionStudent.objects.all()
    serializer_class = AdmissionStudentSerializer

    def create(self, request, *args, **kwargs):
        # Check duplicates
        name = request.data.get("name").strip()
        dob = request.data.get("dob")
        if AdmissionStudent.objects.filter(name__iexact=name, dob=dob).exists():
            return Response({"error": "Duplicate student found!"}, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)

@csrf_exempt
def bulk_upload_students(request, year):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    if "file" not in request.FILES:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    file = request.FILES["file"]

    try:
        import pandas as pd

        # Read Excel
        df = pd.read_excel(file)

        # Normalize column names
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        print("RECEIVED COLUMNS =>", df.columns)
        # Accept multiple naming styles
        column_map = {
            "name": ["name", "full_name", "student_name"],
            "usn": ["usn", "rollnumber", "roll_no"],
            "dob": ["dob", "date_of_birth"],
            "marks10": ["marks10", "tenth_marks"],
            "maxMarks10": ["maxmarks10", "tenth_max"],
            "percentage10": ["percentage10", "tenth_percentage"],
            "marks12": ["marks12", "twelth_marks"],
            "maxMarks12": ["maxmarks12", "twelth_max"],
            "percentage12": ["percentage12", "twelth_percentage"],
            "branch": ["branch", "department"],
        }

        final_cols = {}

        # Map flexible column names
        for key, options in column_map.items():
            for opt in options:
                if opt.lower() in df.columns:
                    final_cols[key] = opt.lower()
                    break

        # Mandatory fields
        for req in ["name", "dob"]:
            if req not in final_cols:
                return JsonResponse({"error": f"Missing required column: {req}"}, status=400)

        saved = 0
        
        skipped = 0

        # Insert rows
        for _, row in df.iterrows():
            try:
                obj, created = Students_data.objects.get_or_create(
                    name=row[final_cols["name"]],
                    dob=row[final_cols["dob"]],
                    defaults={
                        "branch": row.get(final_cols.get("branch"), "Unknown"),
                        "batch_year": year,
                        "percentage10": row.get(final_cols.get("percentage10"), None),
                        "percentage12": row.get(final_cols.get("percentage12"), None),
                    }
                )
                if created:
                    saved += 1
                else:
                    skipped += 1
            except Exception as e:
                skipped += 1
                continue

        return JsonResponse({
            "message": "Bulk upload completed",
            "batch_year": year,
            "records_saved": saved,
            "records_skipped": skipped
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

import easyocr
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from django.db import IntegrityError

from .utils import generate_password_set_link, send_mentor_email

@csrf_exempt
def bulk_upload_mentors(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    if "file" not in request.FILES:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    file = request.FILES["file"]

    try:
        import pandas as pd

        df = pd.read_excel(file)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        column_map = {
            "name": ["name", "full_name", "student_name"],
            "email": ["email", "EmailID"],
            "phone": ["phone", "phone_no", "mobile_no"],
            "department": ["department"],
        }

        final_cols = {}
        for key, options in column_map.items():
            for opt in options:
                if opt.lower() in df.columns:
                    final_cols[key] = opt.lower()
                    break

        # Check mandatory
        for req in ["email"]:
            if req not in final_cols:
                return JsonResponse({"error": f"Missing required column: {req}"}, status=400)

        saved = 0
        skipped = 0

        for _, row in df.iterrows():
            try:
                obj, created = Mentors_data.objects.get_or_create(
                    email=row[final_cols["email"]],
                    defaults={
                        "name": row.get(final_cols.get("name"), ""),
                        "phone": row.get(final_cols.get("phone"), ""),
                        "department": row.get(final_cols.get("department"), None),
                    }
                )
                if created:
                    saved += 1

                    email = row[final_cols["email"]]
                    name = row.get(final_cols.get("name"), "Mentor")

                    create_mentor_user(email, name)
                    
                    link = generate_password_set_link(email)
                    send_mentor_email(email, name, link)
                else:
                    skipped += 1
            except Exception as e:
                skipped += 1
                continue

        return JsonResponse({
            "message": "Bulk upload completed",
            "records_saved": saved,
            "records_skipped": skipped
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def extract_marks_from_image(uploaded_file):
    try:
        # Save image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_name = temp_file.name

        # Run EasyOCR
        reader = easyocr.Reader(["en"], gpu=False)
        result = reader.readtext(temp_name, detail=0)

        text = " ".join(result).lower()

        obtained = None
        total = None

        # Common patterns
        patterns = [
            ("obtained marks", "total marks"),
            ("marks obtained", "out of"),
            ("scored", "out of"),
            ("got", "out of"),
        ]

        import re

        for line in text.split():
            # numbers in text
            pass

        # Extract using regex
        m1 = re.search(r"(\d{2,3})\s*/\s*(\d{2,3})", text)
        if m1:
            obtained = int(m1.group(1))
            total = int(m1.group(2))

        return obtained, total

    except Exception as e:
        print("OCR Error:", e)
        return None, None



# -----------------------------------------------------
# MAIN VIEW: ADD STUDENT + OCR FOR TWO DOCUMENTS
# -----------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def add_student(request):
    print(request.data)
    try:
        name = request.data.get("name")
        dob = request.data.get("dob")
        batch_year = request.data.get("batch_year")

        marks10_file = request.FILES.get("marks10_file")
        marks12_file = request.FILES.get("marks12_file")

        if not name or not dob or not batch_year:
            return Response(
                {"error": "Name, DOB & Batch year are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    #     # ----------------------------
    #     # OCR on Marks 10 file
    #     # ----------------------------
        marks10_obt, marks10_total = (None, None)
        if marks10_file:
            marks10_obt, marks10_total = extract_marks_from_image(marks10_file)

    #     # ----------------------------
    #     # OCR on Marks 12 file
    #     # ----------------------------
        marks12_obt, marks12_total = (None, None)
        if marks12_file:
            marks12_obt, marks12_total = extract_marks_from_image(marks12_file)
        print(marks12_obt, marks12_total )
    #     # ----------------------------
    #     # Save to DB
    #     # ----------------------------
    #     student = Students_data(
    #         name=name,
    #         dob=dob,
    #         batch_year=batch_year,

    #         marks10_obtained=marks10_obt,
    #         marks10_total=marks10_total,

    #         marks12_obtained=marks12_obt,
    #         marks12_total=marks12_total,
    #     )

    #     # Save files
    #     if marks10_file:
    #         student.marks10_file = marks10_file
    #     if marks12_file:
    #         student.marks12_file = marks12_file

    #     student.save()

    #     return Response(
    #         {"message": "Student added successfully", "data": Student_dataSerializer(student).data},
    #         status=status.HTTP_201_CREATED
    #     )

    except Exception as e:
        print("Error in add_student:", e)
        return Response(
            {"error": "Something went wrong"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({"message": "Files received successfully"}, status=status.HTTP_200_OK)

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Mentors_data
import json
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated  # or AllowAny during dev
from rest_framework.response import Response
from django.db import transaction
from math import ceil

from .models import Students_data, Mentors_data
from .serializers import StudentSerializer, MentorSimpleSerializer

@csrf_exempt
def addmentor(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email")
        name = data.get("name", "Mentor")
        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)

        mentor, created = Mentors_data.objects.get_or_create(
            email=email,
            defaults={
                "name": data.get("name"),
                "phone": data.get("phone"),
                "department": data.get("department"),
            }
        )

        if not created:
            return JsonResponse({"error": "Mentor with this email already exists"}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "User with this email already exists"}, status=400)
        create_mentor_user(email, name)
        link = generate_password_set_link(email)
        send_mentor_email(email, data.get("name", "Mentor"), link)
        return JsonResponse({"message": "Mentor added successfully", "mentor_id": mentor.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
import secrets  # for generating random temporary password

def create_mentor_user(email, name):
    if not User.objects.filter(email=email).exists():
        # split name into first/last
        name_parts = name.strip().split(" ")
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        temp_password = secrets.token_urlsafe(8)  # temporary random password
        user = User.objects.create(
            username=email.split("@")[0],
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=make_password(temp_password),
            role="mentor"  # assuming your User model has a role field
        )
        return user
    return User.objects.get(email=email)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def students_list(request):
    """
    GET /students/list/
    Returns all students. Optionally you can filter by query params (branch, batch_year).
    """
    qs = Students_data.objects.all().select_related('assigned_mentor').order_by('name')
    branch = request.query_params.get('branch')
    batch = request.query_params.get('batch_year')
    if branch:
        qs = qs.filter(branch=branch)
    if batch:
        qs = qs.filter(batch_year=batch)

    serializer = StudentSerializer(qs, many=True)
    return Response(serializer.data)

from django.db import models

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mentors_list(request):
    """
    GET /students/mentors/
    Return mentors with computed current_student_count (calculated from Students_data)
    """
    mentors = Mentors_data.objects.all().order_by('name')

    # compute accurate current counts from Students_data (avoid trusting DB field)
    # get counts grouped by mentor id
    counts_qs = Students_data.objects.filter(assigned_mentor__isnull=False).values('assigned_mentor').annotate(count=models.Count('id'))
    counts_map = {c['assigned_mentor']: c['count'] for c in counts_qs}

    mentors_serialized = []
    for m in mentors:
        computed_count = counts_map.get(m.id, 0)
        # If you want to persist this to the DB field, you could set m.current_student_count = computed_count and save.
        mentors_serialized.append({
            'id': m.id,
            'phone':m.phone,
            'name': m.name,
            'email': m.email,
            'department': m.department,
            'max_students': m.max_students,
            'current_student_count': computed_count,
            'created_at': m.created_at,
        })

    return Response(mentors_serialized)

from django.db import transaction
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_assign_mentors(request):
    """
    POST /student/assign-mentors/
    For each department:
      - fetch mentors in that department
      - fetch students in that branch with assigned_mentor is null
      - evenly distribute the unassigned students across mentors
      - update Students_data.assigned_mentor and update mentors' current_student_count
    Response: {"status":"success","assigned": <num_assigned>}
    """
    total_assigned = 0

    # We'll operate department-by-department
    # Gather departments that have mentors
    departments = Mentors_data.objects.values_list('department', flat=True).distinct()

    with transaction.atomic():
        for dept in departments:
            mentors = list(Mentors_data.objects.filter(department=dept).order_by('id'))
            if not mentors:
                continue

            # Unassigned students whose branch matches mentor.department
            students = list(Students_data.objects.filter(branch=dept, assigned_mentor__isnull=True).order_by('id'))
            if not students:
                continue

            num_students = len(students)
            num_mentors = len(mentors)

            # target number per mentor (ceil so all students assigned)
            per_mentor = ceil(num_students / num_mentors)

            student_index = 0
            for mentor in mentors:
                # compute how many we can still assign respecting mentor.max_students
                # compute current assigned count for this mentor from DB
                current_count = Students_data.objects.filter(assigned_mentor=mentor).count()
                capacity_left = None
                if mentor.max_students and mentor.max_students > 0:
                    capacity_left = max(0, mentor.max_students - current_count)
                else:
                    # if max_students==0 treat as unlimited for distribution, but we'd still assign per_mentor
                    capacity_left = per_mentor

                assign_count = min(per_mentor, capacity_left)
                if assign_count <= 0:
                    continue

                chunk = students[student_index: student_index + assign_count]
                for s in chunk:
                    s.assigned_mentor = mentor
                    s.save()
                # update DB field for mentor.current_student_count (optional)
                mentor.current_student_count = Students_data.objects.filter(assigned_mentor=mentor).count()
                mentor.save(update_fields=['current_student_count'])

                total_assigned += len(chunk)
                student_index += len(chunk)
                if student_index >= num_students:
                    break

    return Response({"status": "success", "assigned": total_assigned}, status=status.HTTP_200_OK)

# views.py
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .utils import verify_password_token

User = get_user_model()

# added by google (Python)
from .models import CompanyData,CompanyApplication

@api_view(['GET'])
@permission_classes([AllowAny])
def get_batches(request):
    # distinct batch_year from Students_data
    batches = Students_data.objects.values_list('batch_year', flat=True).distinct().order_by('batch_year')
    # filter out None/Empty if any
    batches = [b for b in batches if b]
    return Response(batches)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_branches(request):
    # distinct branch from Students_data
    branches = Students_data.objects.values_list('branch', flat=True).distinct().order_by('branch')
    branches = [b for b in branches if b]
    return Response(branches)

@api_view(['POST'])
@permission_classes([AllowAny]) # Or IsAuthenticated depending on requirements, user didn't specify auth for this page, assuming public or student/admin
@parser_classes([MultiPartParser, FormParser])
def register_company(request):
    try:
        data = request.data
        
        # Handle JSON fields which might come as strings from FormData
        eligible_batches = data.get('eligible_batches')
        if isinstance(eligible_batches, str):
            try:
                eligible_batches = json.loads(eligible_batches)
            except:
                eligible_batches = []
                
        eligible_branches = data.get('eligible_branches')
        if isinstance(eligible_branches, str):
            try:
                eligible_branches = json.loads(eligible_branches)
            except:
                eligible_branches = []

        company = CompanyData.objects.create(
            company_name=data.get('company_name'),
            eligible_batches=eligible_batches,
            eligible_branches=eligible_branches,
            min_cgpa=data.get('min_cgpa') or None,
            min_10th=data.get('min_10th') or None,
            min_12th=data.get('min_12th') or None,
            jd_text=data.get('jd_text'),
            additional_info=data.get('additional_info'),
            registration_deadline=data.get('registration_deadline') or None
        )
        
        if 'jd_file' in request.FILES:
            company.jd_file = request.FILES['jd_file']
            company.save()
            
        return Response({"message": "Company registered successfully", "id": company.id}, status=201)
    except Exception as e:
        print("Error registering company:", e)
        return Response({"error": str(e)}, status=500)

from django.http import HttpResponse
import pandas as pd

@api_view(['GET'])
@permission_classes([AllowAny])
def export_company_registrations(request):
    companies = CompanyData.objects.all().order_by('-created_at')
    
    data = []
    for c in companies:
        data.append({
            "Company Name": c.company_name,
            "Eligible Batches": ", ".join(map(str, c.eligible_batches)),
            "Eligible Branches": ", ".join(c.eligible_branches),
            "Min CGPA": c.min_cgpa,
            "Min 10th %": c.min_10th,
            "Min 12th %": c.min_12th,
            "Deadline": c.registration_deadline.strftime('%Y-%m-%d %H:%M') if c.registration_deadline else "N/A",
            "Additional Info": c.additional_info,
            "JD Text": c.jd_text[:500] + "..." if c.jd_text and len(c.jd_text) > 500 else c.jd_text
        })
        
    df = pd.DataFrame(data)
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="company_registrations.xlsx"'
    df.to_excel(response, index=False)
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def export_placed_students(request):
    # Filter students with at least one offer
    placed_students = Students_data.objects.filter(offer_count__gt=0).order_by('batch_year', 'branch', 'name')
    
    data = []
    for s in placed_students:
        offers = []
        for cat in [s.product, s.service, s.dream]:
            if cat:
                for o in cat:
                    offers.append(f"{o.get('company')} ({o.get('ctc')} LPA)")
        
        data.append({
            "Name": s.name,
            "Batch": s.batch_year,
            "Branch": s.branch,
            "Offers": ", ".join(offers),
            "Total Offers": s.offer_count
        })
        
    df = pd.DataFrame(data)
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="placed_students.xlsx"'
    df.to_excel(response, index=False)
    return response

@csrf_exempt
def set_mentor_password(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    import json
    data = json.loads(request.body)
    token = data.get("token")
    password = data.get("password")

    if not token or not password:
        return JsonResponse({"error": "Token and password required"}, status=400)

    email = verify_password_token(token)
    if not email:
        return JsonResponse({"error": "Invalid or expired token"}, status=400)

    try:
        user = User.objects.get(email=email)
        user.password = make_password(password)
        user.save()
        return JsonResponse({"message": "Password set successfully"})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_activation_email(request):
    mentor_ids = request.data.get("mentor_ids", [])
    print("Received mentor IDs:", mentor_ids)

    if not mentor_ids:
        return Response({"error": "mentor_ids required"}, status=400)

    mentors = Mentors_data.objects.filter(id__in=mentor_ids)

    if not mentors.exists():
        return Response({"error": "No mentors found"}, status=404)

    for mentor in mentors:
        try:
            # Generate a new token every time OR store in mentor table (your choice)
            activation_token = uuid.uuid4().hex

            activation_link = f"http://localhost:3000/mentor/activate/{activation_token}"

            # Using mentor.email because the email exists HERE
            send_mail(
                subject="Mentor Account Activation",
                message=f"Hello, activate your account here: {activation_link}",
                from_email="admin@student360.com",
                recipient_list=[mentor.email],   # FIXED
            )

        except Exception as e:
            print("Email error:", e)
            return Response({"error": "Mail sending failed"}, status=500)

    return Response({"success": True, "message": "Emails sent successfully"})

@api_view(["POST"])
@permission_classes([AllowAny])

def send_contact_email(request):
    data = request.data
    first_name = data.get("first_name", "")
    last_name = data.get("last_name", "")
    email = data.get("email", "")
    message = data.get("message", "")

    if not all([first_name, email, message]):
        return Response({"error": "Please provide all required fields"}, status=status.HTTP_400_BAD_REQUEST)

    subject = f"New Contact Message from {first_name} {last_name}"
    full_message = f"From: {first_name} {last_name}\nEmail: {email}\n\nMessage:\n{message}"

    try:
        send_mail(
            subject,
            full_message,
            None,  # From email, None uses DEFAULT_FROM_EMAIL
            ["krithikahs14@gmail.com"],  # Replace with your actual receiving email
            fail_silently=False,
        )
        return Response({"message": "Email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#mentor
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_mentor_and_students(request):
    user = request.user  # logged in user

    # Find mentor whose email == user.email
    try:
        mentor = Mentors_data.objects.get(email=user.email)
    except Mentors_data.DoesNotExist:
        return Response({"detail": "Mentor profile not found"}, status=404)

    # Find all students assigned to this mentor (FK stored as assigned_mentor_id)
    students = Students_data.objects.filter(assigned_mentor_id=mentor.id)

    return Response({
        "mentor": MentorSimpleSerializer(mentor).data,
        "students": StudentSerializer(students, many=True).data
    })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Mentors_data, Students_data
from .serializers import MentorSimpleSerializer, StudentSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Mentors_data, Students_data, StudentDocument
from .serializers import MentorSimpleSerializer, StudentSerializer, StudentDocumentSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_mentor_students_documents(request):
    user = request.user

    # 1️⃣ Get mentor
    try:
        mentor = Mentors_data.objects.get(email=user.email)
    except Mentors_data.DoesNotExist:
        return Response({"detail": "Mentor profile not found"}, status=404)

    # 2️⃣ Get all students assigned to this mentor
    students = Students_data.objects.filter(assigned_mentor_id=mentor.id)

    # 3️⃣ Extract the actual student IDs from student_data.student_id
    student_ids = [s.student_id for s in students]  # <--- important

    # 4️⃣ Fetch pending documents for these student_ids
    pending_docs = StudentDocument.objects.filter(student_id__in=student_ids, status="pending")

    # 5️⃣ Build response
    student_list = []
    for student in students:
        student_data = StudentSerializer(student).data

        # Attach pending docs for this student
        student_docs = pending_docs.filter(student_id=student.student_id)
        student_data["documents"] = StudentDocumentSerializer(
            student_docs, many=True, context={"request": request}
        ).data

        student_list.append(student_data)

    return Response({
        "mentor": MentorSimpleSerializer(mentor).data,
        "students": student_list
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def approve_document(request, pk):
    try:
        doc = StudentDocument.objects.get(pk=pk)
    except StudentDocument.DoesNotExist:
        return Response({"detail": "Document not found"}, status=404)

    # Check if the mentor owns the student
    if hasattr(request.user, "mentor_profile"):
        mentor = request.user.mentor_profile
        if doc.student.assigned_mentor_id != mentor.id:
            return Response({"detail": "Not allowed"}, status=403)
    
    doc.status = "approved"
    doc.rejection_reason = None
    doc.save()
    return Response(StudentDocumentSerializer(doc, context={"request": request}).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def reject_document(request, pk):
    rejection_reason = request.data.get("rejection_reason", "").strip()
    if not rejection_reason:
        return Response({"detail": "Rejection reason is required"}, status=400)

    try:
        doc = StudentDocument.objects.get(pk=pk)
    except StudentDocument.DoesNotExist:
        return Response({"detail": "Document not found"}, status=404)

    # Check mentor owns student
    if hasattr(request.user, "mentor_profile"):
        mentor = request.user.mentor_profile
        if doc.student.assigned_mentor_id != mentor.id:
            return Response({"detail": "Not allowed"}, status=403)

    doc.status = "rejected"
    doc.rejection_reason = rejection_reason
    doc.save()
    return Response(StudentDocumentSerializer(doc, context={"request": request}).data)

from rest_framework.views import APIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class PlacementStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        students = Students_data.objects.all()

        serializer = Student_dataSerializer(students, many=True)
        print(serializer.data)
        return Response(serializer.data)

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
import pandas as pd
import io

class FilteredStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("Query params:", request.query_params)
        branches = request.query_params.getlist("branch")
        min_cgpa = request.query_params.get("min_cgpa")
        max_cgpa = request.query_params.get("max_cgpa")
        keyword = request.query_params.get("keyword")
        download_excel = request.query_params.get("download_excel")

        min_cgpa = float(min_cgpa) if min_cgpa else 0
        max_cgpa = float(max_cgpa) if max_cgpa else 10

        # clean branches
        branches = [b.strip() for b in branches if b.strip()]
        if not branches:
            branches = ["all"]
        branches_lower = [b.lower() for b in branches]

        students_list = []

        for student in Student.objects.all():
            print(f"Checking student: {student.id} - {student.user.first_name}")
            try:
                student_data = Students_data.objects.get(student_id=student.id)
            except Students_data.DoesNotExist:
                continue

            # branch filter
            student_branch = (student_data.branch or "").strip().lower()
            if "all" not in branches_lower and student_branch not in branches_lower:
                print(f"Skipping {student.id} due to branch filter")
                continue

            # cgpa filter
            if student.cgpa is None or student.cgpa < min_cgpa or student.cgpa > max_cgpa:
                print(f"Skipping {student.id} due to CGPA {student.cgpa}")
                continue

            # keyword filter
            if keyword:
                student_docs = StudentDocument.objects.filter(student_id=student.id)
                keyword_lower = keyword.lower()
                found = False
                for doc in student_docs:
                    # Convert metadata to string
                    meta_str = str(doc.metadata or "")
                    if keyword_lower in meta_str.lower():
                        found = True
                        break
                if not found:
                    print(f"Skipping {student.id} due to keyword {keyword}")
                    continue

            students_list.append({
                "id": student.id,
                "name": f"{student.user.first_name} {student.user.last_name}",
                "percentage10": student_data.percentage10,
                "percentage12": student_data.percentage12,
                "phone": student.phone,
                "branch": student_data.branch,
                "cgpa": student.cgpa,
            })

        if download_excel == "true":
            df = pd.DataFrame(students_list)
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False)
            buffer.seek(0)
            response = HttpResponse(
                buffer,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename=filtered_students.xlsx'
            return response

        print(students_list)
        return Response(students_list)

        
        # placemnet


def add_offer_logic(student_data, company_name, ctc, company_type):
    ctc = float(ctc)

    offer = {"company": company_name, "ctc": ctc}

    # 1️⃣ SERVICE RULE
    if company_type == "service":

        # If no product → allow parallel services freely
        if not student_data.product:
            student_data.service.append(offer)

        else:
            # product exists → keep only highest service
            student_data.service.append(offer)
            highest = max(student_data.service, key=lambda x: x["ctc"])
            student_data.service = [highest]

        # update count
        student_data.offer_count = (
            len(student_data.product) +
            len(student_data.service) +
            len(student_data.dream)
        )
        student_data.save()
        return

    # 2️⃣ PRODUCT RULE
    if company_type == "product":
        # Always override product with latest one
        student_data.product = [offer]

        student_data.offer_count = (
            len(student_data.product) +
            len(student_data.service) +
            len(student_data.dream)
        )
        student_data.save()
        return

    # 3️⃣ DREAM RULE (company is dream by type)
    if company_type == "dream":
        student_data.dream = [offer]

        student_data.offer_count = (
            len(student_data.product) +
            len(student_data.service) +
            len(student_data.dream)
        )
        student_data.save()
        return


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def placement_bulk_upload(request):
    serializer = BulkPlacementUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    file = serializer.validated_data["file"]
    company_type = serializer.validated_data["company_type"]
    company_name = serializer.validated_data["company_name"]
    default_ctc = serializer.validated_data.get("default_ctc")

    df = pd.read_excel(file)

    if "name" not in df.columns:
        return Response({"error": "Excel must contain 'name' column"}, status=400)

    updated = []

    with transaction.atomic():
        for _, row in df.iterrows():
            print("Processing row:", row.to_dict())

            name = str(row.get("name")).strip()
            usn = str(row.get("usn") or row.get("USN") or "").strip()


            if not name:
                return Response({"error": "Name missing in excel row"}, status=400)

            excel_ctc = row.get("ctc")
            final_ctc = excel_ctc if excel_ctc not in [None, '', 0] else default_ctc

            if not final_ctc:
                return Response({"error": f"CTC missing for {name}"}, status=400)

            # find student
            student = None
            if usn:
                try:
                    print(usn)
                    student_id = int(usn)
                    student = Student.objects.filter(id=student_id).first()
                    print("valid")
                    print(student)
                except ValueError:
                    print(f"Invalid USN (not integer): {usn}")
            if not student:
                
                first, *rest = name.split()
                last = " ".join(rest)

                student = Student.objects.filter(
                    user__first_name__iexact=first,
                    user__last_name__iexact=last
                ).first()


            if not student:
                print("gone")

                continue

            # get Student Data
            student_data, _ = Students_data.objects.get_or_create(
                student=student,
                defaults={
                    "name": f"{student.user.first_name} {student.user.last_name}".strip(),

                    "dob": student.dob,
                    "branch": student.branch,
                    "batch_year": serializer.validated_data["year"]
                }
            )

            add_offer_logic(student_data, company_name, final_ctc, company_type)
            print(
    f"[UPDATED] {student.user.first_name} {student.user.last_name} | "
    f"Company: {company_name} | CTC: {final_ctc} | Type: {company_type}\n"
    f" -> Product: {student_data.product}\n"
    f" -> Service: {student_data.service}\n"
    f" -> Dream: {student_data.dream}\n"
    f" -> Offer Count: {student_data.offer_count}\n"
)

            updated.append({
                "name": name,
                "company": company_name,
                "ctc": final_ctc,
                "type": company_type,
            })
            
    return Response({"status": "ok", "updated": updated})

# student360/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Student


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_search(request):
    q = request.GET.get("q", "").strip()

    if len(q) < 2:
        return Response([])

    # safe text filters only
    filters = (
        Q(name__icontains=q) |
        Q(branch__icontains=q)
    )

    # numeric ID filter (safe)
    if q.isdigit():
        filters |= Q(student_id=int(q)) | Q(id=int(q))

    students = Students_data.objects.filter(filters).distinct()[:50]

    results = []
    for s in students:
        results.append({
            "id": s.id,
            "name": s.name or "",
            "usn": s.student_id or "",
            "branch": s.branch or "",
        })

    return Response(results)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manual_assign(request):
    data = request.data

    company = data.get("company")
    company_type = data.get("type")
    default_ctc = data.get("ctc")     # for students without individual CTC
    year = data.get("year")
    students_list = data.get("students", [])

    if not company or not company_type or not year:
        return Response({"error": "Missing required fields"}, status=400)

    if len(students_list) == 0:
        return Response({"error": "No students selected"}, status=400)

    updated = []

    with transaction.atomic():
        for item in students_list:
            student_id = item.get("id")
            individual_ctc = item.get("ctc") or default_ctc

            if not individual_ctc:
                return Response({"error": f"CTC missing for student {student_id}"}, status=400)

            student = Student.objects.filter(id=student_id).first()
            if not student:
                continue

            student_data, _ = Students_data.objects.get_or_create(
                student=student,
                defaults={
                    "name": f"{student.user.first_name} {student.user.last_name}".strip(),
                    "dob": student.dob,
                    "branch": student.branch,
                    "batch_year": year
                }
            )

            # offer assign logic
            add_offer_logic(student_data, company, individual_ctc, company_type)

            updated.append({
                "name": f"{student.user.first_name} {student.user.last_name}".strip(),
                "student_id": student.id,
                "company": company,
                "type": company_type,
                "ctc": individual_ctc,
            })

    return Response({"status": "ok", "updated": updated})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_students(request):
    students = Students_data.objects.all()
    serializer = Student_dataSerializer(students, many=True)
    return Response(serializer.data)
    

# added by google (Python) - Job Portal Views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_companies(request):
    companies = CompanyData.objects.all().order_by('-created_at')
    
    # Get student from user
    user = request.user
    student = getattr(user, "student_profile", None)
    
    # Get current time
    now = timezone.now()

    result = []

    for company in companies:
        # Check if student has applied
        applied = False
        if student:
            application = CompanyApplication.objects.filter(
                student=student, company=company, applied=True
            ).first()
            applied = application is not None
        
        # Check if deadline has passed
        deadline_crossed = False
        if company.registration_deadline:
            deadline_crossed = now > company.registration_deadline
        
        result.append({
            "id": company.id,
            "company_name": company.company_name,
            "eligible_batches": ", ".join(map(str, company.eligible_batches)),
            "eligible_branches": ", ".join(company.eligible_branches),
            "min_cgpa": company.min_cgpa,
            "min_10th": company.min_10th,
            "min_12th": company.min_12th,
            "jd_file": request.build_absolute_uri(company.jd_file.url) if company.jd_file else None,
            "jd_text": company.jd_text,
            "additional_info": company.additional_info,
            "deadline": company.registration_deadline.strftime('%Y-%m-%d %H:%M') if company.registration_deadline else None,
            "created_at": company.created_at.strftime('%Y-%m-%d %H:%M'),
            "applied": applied,
            "deadline_crossed": deadline_crossed,
        })

    return Response(result)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_for_job(request):
    """
    Student applies for a company
    """
    try:
        user = request.user
        student = getattr(user, "student_profile", None)
        if not student:
            return Response({"error": "Student profile not found"}, status=400)
        
        company_id = request.data.get('company')
        company = CompanyData.objects.get(id=company_id)
        
        # Create or update application
        application, created = CompanyApplication.objects.get_or_create(
            student=student,
            company=company,
            defaults={'applied': True}
        )
        
        if not created:
            application.applied = True
            application.save()
        
        return Response({"message": "Applied successfully"}, status=200)
    except CompanyData.DoesNotExist:
        return Response({"error": "Company not found"}, status=404)
    except Exception as e:
        print("Error applying:", e)
        return Response({"error": str(e)}, status=500)

