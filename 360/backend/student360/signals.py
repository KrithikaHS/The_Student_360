# student360/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student, Students_data

@receiver(post_save, sender=Student)
def link_student_to_studentdata(sender, instance, created, **kwargs):
    """
    After a Student object is created, link existing Students_data entries
    to this Student based on matching fields (e.g., name + dob or email).
    """
    if created:
        # Example using name + dob
        for sd in Students_data.objects.filter(student__isnull=True, name=instance.user.get_full_name(), dob=instance.dob):
            sd.student = instance
            sd.save()
