from django.db import models


class Subscriber(models.Model):
    """Someone who signed up for the newsletter via the homepage/footer form."""
    name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email
