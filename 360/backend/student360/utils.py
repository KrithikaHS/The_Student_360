from itsdangerous import URLSafeTimedSerializer
from django.conf import settings
from django.core.mail import send_mail

# Generate a temporary password link
def generate_password_set_link(email):
    serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
    token = serializer.dumps(email, salt='mentor-set-password')
    return f"http://localhost:5173/set-password/{token}"  # <-- frontend page URL

# Verify the token (for frontend/backend verification if needed)
def verify_password_token(token, expiration=86400):  # 86400 sec = 1 day
    serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
    try:
        email = serializer.loads(token, salt='mentor-set-password', max_age=expiration)
        return email
    except Exception:
        return None

# Send email to mentor
def send_mentor_email(email, name, link):
    subject = "Set your Mentor Password"
    message = f"Hi {name},\n\nClick the link below to set your password. Link expires in 1 day:\n{link}\n\nThanks!"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
