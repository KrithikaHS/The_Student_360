from django.core.exceptions import ValidationError
import re

class StrongPasswordValidator:
    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")

        if user:
            username = user.username if hasattr(user, 'username') else ''
            email = user.email if hasattr(user, 'email') else ''
            if username.lower() in password.lower() or email.lower() in password.lower():
                raise ValidationError("Password cannot be similar to username or email.")

        if not re.search(r'[A-Za-z]', password):
            raise ValidationError("Password must include at least one letter.")
        if not re.search(r'\d', password):
            raise ValidationError("Password must include at least one number.")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must include at least one special character (!@#$%^&* etc.).")

        if password.isdigit() or password.isalpha():
            raise ValidationError("Password cannot be only letters or only numbers.")

    def get_help_text(self):
        return ("Password must be at least 8 characters long, include letters, numbers, "
                "at least one special character, and cannot be similar to username/email.")
