# students/urls.py
from django.urls import path,include
from . import views
from .views import  FilteredStudentsView, get_current_mentor_and_students, get_students, manual_assign, send_contact_email, set_mentor_password, upload_document, list_documents, delete_document
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import AdmissionStudentViewSet
router = DefaultRouter()
router.register(r'admission-students', AdmissionStudentViewSet)

urlpatterns = [
    path("signup/", views.signup_student, name="signup_student"),
    path("login/", views.login_with_role, name="login_with_role"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path("students/upload/", upload_document, name="upload_document"),
    path("students/list/<int:student_id>/", list_documents, name="list_documents"),
    path("students/delete/<int:pk>/", delete_document, name="delete_document"),
    
    path("auth/me/", views.current_user, name="current_user"),
    path("students/<int:student_id>/", views.get_student, name="get_student"),
    path("students/user/<int:user_id>/", views.get_student_by_user_id, name="get_student_by_user_id"),  # added by google (Python)
    path("students/update/<int:student_id>/", views.update_student_profile, name="update_student"),
    path("students/", views.get_student_by_email, name="get_student_by_email"),

    path('api/', include(router.urls)),
    # path("ocr/",views.ocr_marksheet, name="ocr_marks"),
path("students/bulk-upload/<str:year>/", views.bulk_upload_students),
path("students/addstudent/", views.add_student, name="add-student"),

path("students/bulk-upload-mentor/", views.bulk_upload_mentors),
path("students/addmentor/", views.addmentor),
path("students/list/", views.students_list, name="students-list"),
    path("students/mentors/", views.mentors_list, name="mentors-list"),
    path("student/assign-mentors/", views.auto_assign_mentors, name="auto-assign-mentors"),
# path("student/create_mentor/", create_mentor, name="create_mentor"),
# path("student/verify_token/", verify_token, name="verify_token"),
# path("student/set_password/", set_password, name="set_password"),
    path('mentors/set-password/', set_mentor_password),
    path("mentors/resend-activation/", views.resend_activation_email),
    path("contact/", send_contact_email, name="contact"),

    path("mentor/me/students/", get_current_mentor_and_students),
    path("mentor/me/students-documents/", views.get_mentor_students_documents, name="mentor-students-documents"),

    path("documents/<int:pk>/approve/", views.approve_document, name="approve-document"),
    path("documents/<int:pk>/reject/", views.reject_document, name="reject-document"),

    path("placement/students/", views.PlacementStudentsView.as_view(), name="placement-students"),
    path('placement/filtered-students/', FilteredStudentsView.as_view(), name='filtered-students'),

    path("placement/bulk-upload/", views.placement_bulk_upload, name="placement-bulk-upload"),
    path("placement/searchstudent/", views.student_search, name="student_search"),

    path("placement/manual-assign-offer/", manual_assign),
    path("placement/get_students/", get_students),

    # Export placed students by branch
    # path("export-placed/", views.export_placed_students, name="export-placed-students"),

    # Export unplaced students by branch
    # path("export-unplaced/", views.export_unplaced_students, name="export-unplaced-students"),

    # added by google (Python)
    path("placement/batches/", views.get_batches, name="get_batches"),
    path("placement/branches/", views.get_branches, name="get_branches"),
    path("placement/register-company/", views.register_company, name="register_company"),
    path("placement/export-companies/", views.export_company_registrations, name="export_company_registrations"),
    path("placement/export-placed-students/", views.export_placed_students, name="export_placed_students"),

    # added by google (Python) - Job Portal
    path("student/companies/", views.get_all_companies, name="get_all_companies"),
    path("student/apply/", views.apply_for_job, name="apply_for_job"),
    # path("student/ignore/", views.ignore_job, name="ignore_job"),
    
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
