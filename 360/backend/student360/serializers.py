from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Mentors_data, Student, StudentDocument, Students_data

User = get_user_model()


# ----- Simple User Serializer -----
class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role"]


class StudentSignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    dob = serializers.DateField(write_only=True)  # ✅ Add this
    phone = serializers.CharField(required=False, allow_blank=True)
    branch = serializers.CharField(required=False, allow_blank=True)
    semester = serializers.IntegerField(required=False)
    cgpa = serializers.DecimalField(max_digits=4, decimal_places=2, required=False)

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        dob = validated_data.pop("dob")  # ✅ we will use it now

        # Safe name split
        name_parts = full_name.strip().split(" ")
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        username = email.split("@")[0]

        # Create User
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role="student",
        )

        # Create Student Profile **with dob**
        student = Student.objects.create(user=user, dob=dob, **validated_data)

        return student



class StudentDocumentSerializer(serializers.ModelSerializer):
    document_url = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_usn = serializers.CharField(source="student.usn", read_only=True)
    class Meta:
        model = StudentDocument
        fields = ["id", "student", "document_type", "document", "uploaded_at", "status","metadata","student_name",
            "student_usn","document_url","rejection_reason"]
        read_only_fields = ["id", "uploaded_at", "status"]

    def get_document_url(self, obj):
        request = self.context.get('request')
        if request and obj.document:
            return request.build_absolute_uri(obj.document.url)
        return None
# ADMIN
from rest_framework import serializers
from .models import AdmissionStudent

class AdmissionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionStudent
        fields = "__all__"

from rest_framework import serializers
from .models import Student

class Student_dataSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    assigned_mentor_name = serializers.SerializerMethodField()
    class Meta:
        model = Students_data
        fields = "__all__"
    def get_assigned_mentor_name(self, obj):
        if obj.assigned_mentor_id:
            try:
                mentor = Mentors_data.objects.get(id=obj.assigned_mentor_id)
                return mentor.name
            except Mentors_data.DoesNotExist:
                return None
        return None

class Mentor_dataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentors_data
        fields = "__all__"
        
class MentorSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentors_data
        fields = ['id', 'name','phone', 'email', 'department', 'max_students', 'current_student_count']

class StudentSerializer(serializers.ModelSerializer):
    assigned_mentor = serializers.SerializerMethodField()
    assigned_mentor_id = serializers.IntegerField()
    phone = serializers.SerializerMethodField()
    cgpa = serializers.SerializerMethodField()
    class Meta:
        model = Students_data
        fields = [
            'id','name', 'branch', 'dob', 'batch_year',
            'percentage10', 'percentage12',
            'assigned_mentor', 'assigned_mentor_id', 'created_at',"phone",
            "cgpa",
        ]
    def get_phone(self, obj):
        try:
            student = Student.objects.get(id=obj.student_id)
            return student.phone
        except Student.DoesNotExist:
            return None

    def get_cgpa(self, obj):
        try:
            student = Student.objects.get(id=obj.student_id)
            return student.cgpa
        except Student.DoesNotExist:
            return None
    def get_assigned_mentor(self, obj):
        if obj.assigned_mentor_id:
            try:
                mentor = Mentors_data.objects.get(id=obj.assigned_mentor_id)
                return mentor.name  # <-- only name
            except Mentors_data.DoesNotExist:
                return None
        return None

#mentor

# class MentorSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Mentors_data
#         fields = "__all__"

# class StudentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Student
#         fields = "__all__"

# class StudentDocumentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = StudentDocument
#         fields = "__all__"

class BulkPlacementUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    year = serializers.CharField()
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_type = serializers.CharField()  # product/service/dream
    default_ctc = serializers.CharField(required=False, allow_blank=True)
